export type CardInput = {
  number: string;
  holder_name: string;
  exp_month: number;
  exp_year: number;
  cvv: string;
};
export async function tokenizeCard(card: CardInput, publicKey: string) {
  const response = await fetch(
    `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(publicKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "card", card }),
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("Não foi possível tokenizar o cartão.");
  return String(data.id ?? data.token);
}
