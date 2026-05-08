"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateProfile } from "@/app/actions/profile";

const PAYMENT_OPTIONS = [
  "Efectivo",
  "Transferencia bancaria",
  "MercadoPago",
  "Uala",
  "PayPal",
];

interface ProfileFormProps {
  initialValues: {
    username: string;
    city: string;
    country: string;
    ships: boolean;
    shippingNotes: string;
    paymentMethods: string[];
  };
}

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const [values, setValues] = useState(initialValues);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function togglePayment(method: string) {
    setValues((v) => ({
      ...v,
      paymentMethods: v.paymentMethods.includes(method)
        ? v.paymentMethods.filter((m) => m !== method)
        : [...v.paymentMethods, method],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setMessage(null);
    const result = await updateProfile(values);
    setIsPending(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Perfil actualizado correctamente." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input
          id="username"
          value={values.username}
          onChange={(e) => setValues((v) => ({ ...v, username: e.target.value }))}
          placeholder="tu_usuario"
          required
          minLength={3}
          maxLength={30}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={values.city}
            onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
            placeholder="Buenos Aires"
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            value={values.country}
            onChange={(e) =>
              setValues((v) => ({ ...v, country: e.target.value }))
            }
            placeholder="Argentina"
            maxLength={100}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="ships">Realizo envíos</Label>
          <Switch
            id="ships"
            checked={values.ships}
            onCheckedChange={(ships) => setValues((v) => ({ ...v, ships }))}
          />
        </div>
        {values.ships && (
          <div className="space-y-1.5">
            <Label htmlFor="shippingNotes">Notas de envío</Label>
            <Textarea
              id="shippingNotes"
              value={values.shippingNotes}
              onChange={(e) =>
                setValues((v) => ({ ...v, shippingNotes: e.target.value }))
              }
              placeholder="ej: Envío por Correo Argentino, OCA, etc."
              rows={2}
              maxLength={200}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Medios de pago aceptados</Label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => togglePayment(method)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                values.paymentMethods.includes(method)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.type === "error" ? "text-destructive" : "text-green-600"
          }`}
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
