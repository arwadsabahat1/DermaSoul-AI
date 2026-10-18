import { type FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { api } from "../api/client";
import { fetchProfile, updateProfile } from "../api/profile";
import type { Profile } from "../types/models";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { getApiErrorMessage } from "../lib/errors";
import { useAuth } from "../contexts/AuthContext";

const GENDERS = ["male", "female", "other", "prefer_not_to_say"] as const;

export function ProfilePage() {
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [delPw, setDelPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [delBusy, setDelBusy] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    age: "" as string | number,
    gender: "",
    phone: "",
    known_allergies: "",
    medical_history: "",
    skin_concerns: "",
    current_products: "",
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const p = await fetchProfile();
        if (cancelled) return;
        setProfile(p);
        setForm({
          full_name: p.full_name ?? "",
          age: p.age ?? "",
          gender: p.gender ?? "",
          phone: p.phone ?? "",
          known_allergies: p.known_allergies ?? "",
          medical_history: p.medical_history ?? "",
          skin_concerns: p.skin_concerns ?? "",
          current_products: p.current_products ?? "",
        });
      } catch (e) {
        if (!cancelled) toast.error(getApiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        full_name: form.full_name.trim() || null,
        phone: form.phone.trim() || null,
        known_allergies: form.known_allergies.trim() || null,
        medical_history: form.medical_history.trim() || null,
        skin_concerns: form.skin_concerns.trim() || null,
        current_products: form.current_products.trim() || null,
      };
      if (form.gender) body.gender = form.gender;
      if (form.age !== "" && form.age !== null) {
        const n = Number(form.age);
        if (!Number.isNaN(n)) body.age = n;
      }
      const updated = await updateProfile(body);
      setProfile(updated);
      toast.success("Profile updated.");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error("New password needs at least 8 characters.");
      return;
    }
    setPwBusy(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPw,
        new_password: newPw,
      });
      toast.success("Password refreshed.");
      setCurrentPw("");
      setNewPw("");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setPwBusy(false);
    }
  }

  async function handleDeleteAccount(e: FormEvent) {
    e.preventDefault();
    if (!window.confirm("Permanently delete your account and consultation images?")) {
      return;
    }
    setDelBusy(true);
    try {
      await api.post("/auth/delete-account", { password: delPw });
      logout();
      toast.success("Account closed.");
      window.location.assign("/");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setDelBusy(false);
    }
  }

  if (loading || !profile) {
    return <div className="flex min-h-[30vh] items-center justify-center text-forest-900/55">Gathering studio notes…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
      <header>
        <p className="text-xs uppercase tracking-[0.35em] text-forest-900/35">Profile & safeguards</p>
        <h1
          className="mt-2 text-4xl text-forest-900"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Gentle record-keeping—owned by you.
        </h1>
      </header>

      <motion.form
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onSubmit={(e) => void handleSave(e)}
        className="space-y-8"
      >
        <GlassCard>
          <h2 className="text-lg font-medium">Identity</h2>
          <p className="text-sm text-forest-900/55">{user?.email}</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              Full name
              <input
                value={form.full_name}
                onChange={(ev) => setForm((s) => ({ ...s, full_name: ev.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-2.5 outline-none focus:ring-2"
              />
            </label>
            <label className="text-sm">
              Age
              <input
                type="number"
                min={1}
                max={120}
                value={form.age}
                onChange={(ev) => setForm((s) => ({ ...s, age: ev.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-2.5 outline-none focus:ring-2"
              />
            </label>
            <label className="text-sm">
              Gender
              <select
                value={form.gender}
                onChange={(ev) => setForm((s) => ({ ...s, gender: ev.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-2.5 outline-none focus:ring-2"
              >
                <option value="">Prefer not to say</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              Phone
              <input
                value={form.phone}
                onChange={(ev) => setForm((s) => ({ ...s, phone: ev.target.value }))}
                className="mt-2 w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-2.5 outline-none focus:ring-2"
              />
            </label>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-medium">Clinical-adjacent context</h2>
          <div className="mt-6 space-y-5">
            <label className="block text-sm">
              Known allergies
              <textarea
                value={form.known_allergies}
                onChange={(ev) => setForm((s) => ({ ...s, known_allergies: ev.target.value }))}
                rows={3}
                maxLength={1000}
                className="mt-2 w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-3 outline-none focus:ring-2"
              />
            </label>
            <label className="block text-sm">
              Ongoing concerns
              <textarea
                value={form.skin_concerns}
                onChange={(ev) => setForm((s) => ({ ...s, skin_concerns: ev.target.value }))}
                rows={3}
                maxLength={1000}
                className="mt-2 w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-3 outline-none focus:ring-2"
              />
            </label>
            <label className="block text-sm">
              Medical narrative (stored encrypted-at-rest depends on infra)
              <textarea
                value={form.medical_history}
                onChange={(ev) => setForm((s) => ({ ...s, medical_history: ev.target.value }))}
                rows={4}
                maxLength={2000}
                className="mt-2 w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-3 outline-none focus:ring-2"
              />
            </label>
            <label className="block text-sm">
              Current skincare products
              <textarea
                value={form.current_products}
                onChange={(ev) => setForm((s) => ({ ...s, current_products: ev.target.value }))}
                rows={3}
                maxLength={1000}
                className="mt-2 w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-3 outline-none focus:ring-2"
              />
            </label>
          </div>
          <div className="mt-8 flex justify-end">
            <Button type="submit" loading={saving}>
              Save profile
            </Button>
          </div>
        </GlassCard>
      </motion.form>

      <GlassCard>
        <h2 className="text-lg font-medium">Credentials</h2>
        <form onSubmit={(e) => void handlePassword(e)} className="mt-6 space-y-4">
          <label className="block text-sm">
            Current password
            <input
              type="password"
              required
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-2.5 outline-none focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            New password
            <input
              type="password"
              required
              minLength={8}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/40 bg-white/60 px-4 py-2.5 outline-none focus:ring-2"
            />
          </label>
          <Button type="submit" variant="secondary" loading={pwBusy}>
            Update password
          </Button>
        </form>
      </GlassCard>

      <GlassCard className="border-red-200/60 bg-red-50/30">
        <h2 className="text-lg font-medium text-red-900">Close studio permanently</h2>
        <p className="mt-2 text-sm text-red-900/70">
          Deletes your account, profile, consultation records, and stored analysis images.
        </p>
        <form onSubmit={(e) => void handleDeleteAccount(e)} className="mt-6 space-y-4">
          <label className="block text-sm text-red-900">
            Confirm with password
            <input
              type="password"
              required
              value={delPw}
              onChange={(e) => setDelPw(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-red-200/60 bg-white px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-400"
            />
          </label>
          <Button type="submit" variant="danger" loading={delBusy}>
            Delete account forever
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
