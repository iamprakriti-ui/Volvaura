@api.get("/")
async def root():
    return {"service": "volvaura", "ok": True}


# ---------- Stripe Payments (Flow B — Emergent-managed shared sandbox) ----------
# Featured-editor boost packages. Amounts defined server-side only.
BOOST_PACKAGES = {
    "boost_starter": {
        "amount": 29.0,
        "name": "Spotlight — 7 days",
        "description": "Pinned to the top of the roster for 7 days.",
        "duration_days": 7,
    },
    "boost_pro": {
        "amount": 79.0,
        "name": "Featured — 30 days",
        "description": "Homepage featured slot + top of roster for 30 days.",
        "duration_days": 30,
    },
    "boost_elite": {
        "amount": 199.0,
        "name": "Signature — 90 days",
        "description": "90 days featured + priority curation matches.",
        "duration_days": 90,
    },
}


def get_stripe_checkout(request: Request) -> StripeCheckout:
    api_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    return StripeCheckout(api_key=api_key, webhook_url=webhook_url)


class CheckoutIn(BaseModel):
    package_id: str
    origin_url: str


@api.get("/payments/packages")
async def list_packages():
    return [{"id": k, **v} for k, v in BOOST_PACKAGES.items()]


@api.post("/payments/checkout")
async def create_checkout(payload: CheckoutIn, request: Request, user: dict = Depends(get_current_user)):
    pkg = BOOST_PACKAGES.get(payload.package_id)
    if not pkg:
        raise HTTPException(status_code=400, detail="Unknown package.")
    origin = payload.origin_url.rstrip("/")
    stripe_checkout = get_stripe_checkout(request)
    session = await stripe_checkout.create_checkout_session(
        CheckoutSessionRequest(
            amount=pkg["amount"],
            currency="usd",
            success_url=f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin}/payment/cancel",
            metadata={
                "user_id": user["id"],
                "user_email": user["email"],
                "package_id": payload.package_id,
                "package_name": pkg["name"],
            },
        )
    )
    await db.payment_transactions.insert_one(
        {
            "session_id": session.session_id,
            "user_id": user["id"],
            "package_id": payload.package_id,
            "amount": pkg["amount"],
            "currency": "usd",
            "status": "initiated",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return {"checkout_url": session.url, "session_id": session.session_id}


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            stripe_checkout = get_stripe_checkout(request)
            s = await stripe_checkout.get_checkout_status(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {
                        "$set": {
                            "status": "completed",
                            "payment_status": "paid",
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        }
                    },
                )
                # activate boost
                pkg = BOOST_PACKAGES.get(record.get("package_id"))
                if pkg:
                    await db.editor_profiles.update_one(
                        {"user_id": record["user_id"]},
                        {
                            "$set": {
                                "boost_active": True,
                                "boost_package": record["package_id"],
                                "boost_expires_at": (
                                    datetime.now(timezone.utc)
                                    + timedelta(days=pkg["duration_days"])
                                ).isoformat(),
                            }
                        },
                    )
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except Exception as e:
            logger.warning(f"Stripe status check failed: {e}")
    return {
        "session_id": record["session_id"],
        "status": record["status"],
        "payment_status": record["payment_status"],
    }


@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    stripe_checkout = get_stripe_checkout(request)
    try:
        event = await stripe_checkout.handle_webhook(body, sig)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")
    session_id = event.session_id
    if session_id and event.payment_status == "paid":
        result = await db.payment_transactions.update_one(
            {"session_id": session_id, "payment_status": {"$ne": "paid"}},
            {
                "$set": {
                    "status": "completed",
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
        if result.modified_count:
            record = await db.payment_transactions.find_one({"session_id": session_id})
            pkg = BOOST_PACKAGES.get(record.get("package_id"))
            if pkg and record:
                await db.editor_profiles.update_one(
                    {"user_id": record["user_id"]},
                    {
                        "$set": {
                            "boost_active": True,
                            "boost_package": record["package_id"],
                            "boost_expires_at": (
                                datetime.now(timezone.utc)
                                + timedelta(days=pkg["duration_days"])
                            ).isoformat(),
                        }
                    },
                )
    return {"ok": True}
