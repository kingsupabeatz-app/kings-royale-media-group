/* ============================================================
   STRIPE PAYMENT LINKS  —  paste yours here, that's the only step.
   1. dashboard.stripe.com  ->  Payment Links  ->  + New
   2. Create one link per item below (set the price/recurring as shown).
   3. Copy each "https://buy.stripe.com/..." URL between the quotes.
   Leave any blank to fall back to an email order. Re-deploy after editing.
   ============================================================ */
window.KSB_STRIPE = {
  // one-time services
  "Custom Beat ($250)": "",
  "Premium Custom Beat ($500)": "",
  "Exclusive Production Package ($1000+)": "",
  // memberships (create these as RECURRING / monthly Payment Links)
  "Bronze Membership ($49/mo)": "",
  "Silver Membership ($99/mo)": "",
  "Gold Membership ($199/mo)": "",
  "Royal Artist Club ($299/mo)": ""
};
