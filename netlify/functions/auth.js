const {
  createPinAuth,
  getStoredProfile,
  json,
  normalizeProfileForStorage,
  normalizeUsername,
  publicProfile,
  upsertStoredProfile,
  verifyPin,
} = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const username = normalizeUsername(body.username);
    if (!username) {
      return json(400, { error: "กรุณาใส่ username" });
    }

    if (body.action === "lookup" || event.path.endsWith("/api/auth/lookup")) {
      const storedProfile = await getStoredProfile(username);
      return json(200, { ok: true, exists: Boolean(storedProfile) });
    }

    if (body.action === "complete" || event.path.endsWith("/api/auth/complete")) {
      const pin = String(body.pin || "");
      if (!/^\d{6}$/.test(pin)) {
        return json(400, { error: "กรุณาใส่ PIN 6 หลัก" });
      }

      const storedProfile = await getStoredProfile(username);
      if (storedProfile) {
        if (!verifyPin(storedProfile, pin)) {
          return json(401, { error: "PIN ไม่ถูกต้อง" });
        }

        if (!storedProfile.auth?.pinHash) {
          const migratedProfile = { ...storedProfile, auth: createPinAuth(pin) };
          delete migratedProfile.pin;
          await upsertStoredProfile(username, migratedProfile);
          return json(200, { ok: true, exists: true, profile: publicProfile(migratedProfile) });
        }

        return json(200, { ok: true, exists: true, profile: publicProfile(storedProfile) });
      }

      const newProfile = normalizeProfileForStorage({
        known: false,
        onboarding: {},
        debts: [],
        checkpoints: {},
        auth: createPinAuth(pin),
      });
      await upsertStoredProfile(username, newProfile);
      return json(200, { ok: true, exists: false, profile: publicProfile(newProfile) });
    }

    if (body.action === "save" || event.path.endsWith("/api/profile/save")) {
      const existingProfile = await getStoredProfile(username);
      const nextProfile = normalizeProfileForStorage({
        ...(existingProfile || {}),
        ...(body.profile || {}),
        auth: existingProfile?.auth,
      });
      delete nextProfile.pin;
      await upsertStoredProfile(username, nextProfile);
      return json(200, { ok: true, profile: publicProfile(nextProfile) });
    }

    return json(404, { error: "ไม่พบ auth endpoint" });
  } catch (error) {
    return json(error.statusCode || 500, {
      error: "backend auth ทำงานไม่สำเร็จ",
      detail: error.message,
    });
  }
};
