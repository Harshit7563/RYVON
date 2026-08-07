import { Link } from "react-router-dom";

/**
 * Deep policy content for RYVON footwear storefront.
 * Each page: intro + detailed sections (paragraphs / bullets).
 */

const PAGES = {
  faqs: {
    title: "Frequently Asked Questions",
    updated: "August 2026",
    intro:
      "Everything you need to know about shopping shoes on RYVON — sizing, orders, delivery, returns, and payments. Still stuck? Reach us anytime via Contact Us.",
    sections: [
      {
        h: "Orders & Checkout",
        items: [
          {
            q: "How do I place an order?",
            a: "Browse Shop or a product page, select your UK size, add to cart, then checkout with your delivery details. You’ll get an Order ID on the confirmation page — save it to track your order anytime.",
          },
          {
            q: "Can I modify or cancel my order after placing it?",
            a: "You can request cancellation before the order is shipped (usually within a few hours of placing it). Once packed or shipped, cancellation isn’t possible — use our return/exchange flow after delivery instead. See Cancellation Policy for full rules.",
          },
          {
            q: "Do you offer Cash on Delivery (COD)?",
            a: "Yes. COD is available on most serviceable pin codes across India. For prepaid orders (UPI / card / net banking where enabled), you get an extra 5% off on the product total as shown on the site.",
          },
          {
            q: "I didn’t receive an order confirmation. What should I do?",
            a: "Check spam/promotions for emails from RYVON. You can also track using the Order ID from the success page under Track Order. If nothing shows up within 2 hours, contact support with your name, phone, and approximate order time.",
          },
        ],
      },
      {
        h: "Sizing & Fit",
        items: [
          {
            q: "How do I choose the right shoe size?",
            a: "Use the Size Guide on every product page. Measure your foot length in centimetres (heel to longest toe) and match it to the UK size chart. If you’re between sizes, we generally recommend going up half/one size for sneakers with a snug toe box.",
          },
          {
            q: "Are RYVON sizes true to fit?",
            a: "Most lifestyles and low-tops fit true to size. High-tops and performance styles can feel slightly snug on first wear and ease after a few uses. Always check the product description for fit notes (e.g. “runs small”).",
          },
          {
            q: "What if the size doesn’t fit?",
            a: "You can request a size exchange or return within 7 days of delivery, provided the pair is unused, unworn outdoors, and returned with original box, tags, and all packaging. Exchanges depend on stock of the requested size.",
          },
        ],
      },
      {
        h: "Shipping & Delivery",
        items: [
          {
            q: "How long does delivery take?",
            a: "Most metro and Tier-1 cities receive orders in 3–5 business days. Other serviceable locations typically take 4–7 business days. Remote or high-altitude pin codes may take longer. Business days exclude Sundays and public holidays.",
          },
          {
            q: "Is shipping free?",
            a: "Yes — free standard shipping on orders ₹999 and above. Below ₹999, a flat shipping fee of ₹79 applies (shown at checkout).",
          },
          {
            q: "How do I track my order?",
            a: "Go to Track Order, enter your Order ID, and view live status (Placed → Packed → Shipped → Out for delivery → Delivered). You’ll also get status updates on the contact details shared at checkout.",
          },
          {
            q: "What if I’m not available at delivery?",
            a: "Our courier usually attempts 2–3 deliveries. If undelivered, the shipment may return to us. Contact support quickly with your Order ID so we can arrange a reattempt or guide you on next steps.",
          },
        ],
      },
      {
        h: "Returns, Exchanges & Refunds",
        items: [
          {
            q: "What is your return window?",
            a: "7 days from the date of delivery for unused footwear in original condition. The return request must be raised within this window.",
          },
          {
            q: "When will I get my refund?",
            a: "Once we receive and QC-approve the return, prepaid refunds are initiated within 5–7 business days to the original payment method. Bank timelines may add 2–5 business days. COD refunds are issued via UPI/bank transfer after you share valid details.",
          },
          {
            q: "Can I exchange for a different style (not just size)?",
            a: "Standard exchanges are for size/colour of the same product when stock allows. For a different style, return the original pair and place a new order.",
          },
        ],
      },
      {
        h: "Product & Quality",
        items: [
          {
            q: "Are the shoes authentic RYVON products?",
            a: "Yes. Every pair sold on ryvon.in (and official RYVON channels) is genuine. We do not sell grey-market or third-party counterfeit footwear.",
          },
          {
            q: "There is a manufacturing defect. What now?",
            a: "Contact us within 7 days of delivery with clear photos/video of the issue and your Order ID. Verified manufacturing defects are eligible for replacement or refund as per our Returns policy, even if the pair was tried on indoors.",
          },
          {
            q: "How should I care for my shoes?",
            a: "Wipe with a soft dry cloth after use. Avoid machine wash unless the care label says otherwise. Keep away from extreme heat. For suede/nubuck, use a dedicated brush and protector spray. Detailed care tips are listed on each product page.",
          },
        ],
      },
      {
        h: "Account & Privacy",
        items: [
          {
            q: "Do I need an account to order?",
            a: "Yes. You can checkout as a guest with name, email, phone and address. Creating an account helps you track orders faster, sync wishlist across devices, and manage your profile.",
          },
          {
            q: "How is my data used?",
            a: "We use your details only to fulfil orders, provide support, and (if you opt in) share drops and offers. Read our Privacy Policy for full details.",
          },
        ],
      },
    ],
  },

  returns: {
    title: "Returns, Exchanges & Refunds",
    updated: "August 2026",
    intro:
      "We want every pair to feel right. If something isn’t perfect, our 7-day returns and size-exchange policy for footwear is designed to be clear, fair, and India-friendly.",
    sections: [
      {
        h: "Eligibility (what qualifies)",
        paras: [
          "You may request a return or size exchange within 7 (seven) calendar days from the delivery date shown on your Track Order page.",
        ],
        bullets: [
          "Shoes must be unused and not worn outdoors (indoor try-on on clean surfaces is OK).",
          "Original RYVON box, dust bags (if any), tags, spare laces, and all inserts must be returned.",
          "Product must be in saleable condition with no stains, scuffs, odour, or altered parts.",
          "Invoice / packing slip should be included when possible.",
          "Return request must be raised before the 7-day window ends.",
        ],
      },
      {
        h: "Non-returnable / non-exchangeable",
        bullets: [
          "Footwear worn outdoors, washed, or damaged by the customer.",
          "Products returned without original box, tags, or with missing accessories.",
          "Customised / personalised pairs (if offered in future drops).",
          "Final sale / clearance items clearly marked “Non-returnable” on the product page.",
          "Requests raised after 7 days of delivery (except verified manufacturing defects reported promptly).",
        ],
      },
      {
        h: "How to raise a return or exchange",
        bullets: [
          "Go to Track Order and enter your Order ID, or Contact Us with Order ID + reason.",
          "Share clear photos of the pair, box label, and (for defects) close-ups of the issue.",
          "For size exchange: mention the UK size you want. We’ll confirm stock before arranging pickup.",
          "Once approved, our partner courier will schedule a reverse pickup from your delivery address (most pin codes).",
          "Pack the shoes securely in the original box, then place that inside a courier bag/outer carton.",
        ],
      },
      {
        h: "Size exchanges",
        paras: [
          "Size exchanges are offered on the same product (same colourway) subject to stock. If your size is unavailable, you may choose a refund or waitlist for restock where offered.",
          "Only one complimentary size exchange is allowed per order line item. Further exchanges may be treated as a fresh return + new purchase.",
        ],
      },
      {
        h: "Refunds",
        paras: [
          "Refunds are processed only after the returned pair passes quality check at our warehouse (typically 2–4 business days after pickup).",
        ],
        bullets: [
          "Prepaid orders: refund to original payment method within 5–7 business days of QC approval. Your bank/UPI app may take additional 2–5 business days to reflect credit.",
          "COD orders: refund via UPI or NEFT to the account details you share with support (usually within 5–7 business days of QC approval).",
          "Shipping fees (if charged on the original order below ₹999) are non-refundable unless the return is due to our error (wrong item / defect / damaged in transit).",
          "Prepaid discount (extra 5% off) is reversed proportionally if only part of a multi-item order is returned.",
        ],
      },
      {
        h: "Wrong product, damaged in transit, or manufacturing defect",
        paras: [
          "If you receive the wrong size/style, a damaged box with damaged shoes, or a clear manufacturing defect, contact us within 48 hours of delivery with photos/video. We’ll arrange priority pickup and offer replacement or full refund including shipping where applicable.",
        ],
      },
      {
        h: "Refunds we may decline",
        bullets: [
          "Items failing QC (used, soiled, or incomplete packaging).",
          "Returns without a prior approved request / invalid Order ID.",
          "Duplicate or fraudulent claims.",
        ],
      },
    ],
  },

  shipping: {
    title: "Shipping Policy",
    updated: "August 2026",
    intro:
      "We ship RYVON footwear across India through trusted courier partners. This policy covers charges, timelines, tracking, and what happens if delivery fails.",
    sections: [
      {
        h: "Serviceable areas",
        paras: [
          "We deliver to most pin codes across India. At checkout, if your pin code is not serviceable for COD or courier, we’ll ask you to use an alternate address or prepaid-only shipping where available.",
        ],
      },
      {
        h: "Shipping charges",
        bullets: [
          "Free standard shipping on prepaid and COD orders with product total ₹999 or more.",
          "Flat ₹79 shipping on orders below ₹999.",
          "Remote area surcharges may apply in rare cases; if so, we’ll inform you before dispatch.",
          "Extra 5% off on prepaid product totals is separate from shipping and shown in cart/checkout messaging.",
        ],
      },
      {
        h: "Processing & dispatch",
        bullets: [
          "Orders placed before 2:00 PM IST on business days are usually processed the same day.",
          "Standard dispatch window: 24–48 hours on business days after order confirmation.",
          "During big sales, new drops, or public holidays, dispatch may take up to 72 hours.",
          "You’ll see status move from Placed → Packed → Shipped on Track Order.",
        ],
      },
      {
        h: "Delivery timelines (estimate)",
        bullets: [
          "Metros & major cities: 3–5 business days from dispatch.",
          "Tier-2 / Tier-3 cities: 4–7 business days from dispatch.",
          "North-East, J&K, and remote locations: 7–10 business days where serviceable.",
        ],
        paras: [
          "These are estimates, not guarantees. Delays can occur due to weather, political disruptions, courier capacity, incorrect address, or customer unavailability.",
        ],
      },
      {
        h: "Order tracking",
        paras: [
          "Every confirmed order gets a unique Order ID on the success page. Use Track Order anytime to view status. Once handed to the courier, tracking details (where available) are reflected in status updates. Keep your phone reachable for delivery calls/SMS.",
        ],
      },
      {
        h: "Failed delivery & returns to origin",
        bullets: [
          "Couriers typically attempt delivery 2–3 times.",
          "If the shipment returns to us (RTO) due to wrong address, unreachable phone, or refused delivery (without a valid defect claim), we may deduct actual shipping/RTO costs from any refund.",
          "Refusing a COD order repeatedly may limit COD eligibility on future orders.",
        ],
      },
      {
        h: "Damaged packaging on arrival",
        paras: [
          "If the outer carton is badly damaged, please open a video recording before unboxing, check the shoes, and contact us within 48 hours with the video and Order ID. Do not use the product if you intend to claim transit damage.",
        ],
      },
      {
        h: "International shipping",
        paras: [
          "Currently RYVON ships only within India. International shipping may be introduced later; this page will be updated when available.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    updated: "August 2026",
    intro:
      "RYVON (“we”, “us”, “our”) respects your privacy. This policy explains what personal data we collect when you use our website and services, why we collect it, how we protect it, and your rights under applicable Indian law including the Digital Personal Data Protection Act, 2023 (DPDP Act) principles where applicable.",
    sections: [
      {
        h: "Who we are",
        paras: [
          "RYVON is an Indian footwear brand operating this online store. For privacy questions, contact ryvonsupport@gmail.com with the subject “Privacy Request”.",
        ],
      },
      {
        h: "Information we collect",
        bullets: [
          "Identity & contact: name, email, phone number, billing/shipping address.",
          "Order data: products purchased, sizes, amounts, payment mode (we do not store full card numbers on our servers).",
          "Account & wishlist data if you create an account or save favourites.",
          "Support messages you send via Contact Us or email.",
          "Technical data: IP address, device/browser type, pages viewed, and approximate location derived from IP (for security and analytics).",
          "Cookies and similar technologies for session, cart, and preferences.",
        ],
      },
      {
        h: "How we use your information",
        bullets: [
          "To process, pack, ship, and support your orders.",
          "To communicate order status, delays, returns, and critical service messages.",
          "To improve our website, product catalogue, and customer experience.",
          "To detect fraud, abuse, and security incidents.",
          "To send marketing about new drops and offers only if you opt in or as permitted by law — you can unsubscribe anytime.",
          "To comply with legal, tax, and accounting obligations.",
        ],
      },
      {
        h: "Legal basis / purpose limitation",
        paras: [
          "We process personal data for clear purposes: contract fulfilment (your order), legitimate operations (fraud prevention, analytics), legal compliance, and consent where required (marketing). We do not sell your personal data to third parties.",
        ],
      },
      {
        h: "Sharing with third parties",
        paras: [
          "We share only what’s necessary with trusted partners under confidentiality obligations:",
        ],
        bullets: [
          "Logistics / courier partners — name, phone, address, package details.",
          "Payment gateways / banks — payment confirmation data (when prepaid is enabled).",
          "IT, hosting, SMS/email, and analytics providers who process data on our instructions.",
          "Government or law enforcement when legally required.",
        ],
      },
      {
        h: "Data retention",
        paras: [
          "Order and invoice records are kept as required under Indian tax and commercial laws (typically several years). Support chats are kept as needed to resolve issues. Marketing lists are pruned when you unsubscribe. When data is no longer needed, we delete or anonymise it where feasible.",
        ],
      },
      {
        h: "Security",
        paras: [
          "We use reasonable technical and organisational safeguards (HTTPS, access controls, least-privilege admin access). No method of transmission over the internet is 100% secure; please use a strong password and don’t share OTPs or login details.",
        ],
      },
      {
        h: "Your rights",
        bullets: [
          "Access the personal data we hold about you.",
          "Request correction of inaccurate data.",
          "Request deletion where legally allowed (we may retain data required for orders, disputes, or law).",
          "Withdraw marketing consent.",
          "Raise a grievance at ryvonsupport@gmail.com — we aim to respond within 72 hours for acknowledgement and resolve within a reasonable period.",
        ],
      },
      {
        h: "Children",
        paras: [
          "Our store is directed at adults. If you believe a minor has shared personal data with us, contact us and we will take appropriate steps to delete it.",
        ],
      },
      {
        h: "Policy updates",
        paras: [
          "We may update this Privacy Policy from time to time. The “Last updated” date at the top will change. Continued use of the site after updates means you acknowledge the revised policy.",
        ],
      },
    ],
  },

  terms: {
    title: "Terms & Conditions",
    updated: "August 2026",
    intro:
      "Welcome to RYVON. By accessing our website, creating an account, or placing an order, you agree to these Terms & Conditions. Please read them carefully. If you do not agree, do not use our services.",
    sections: [
      {
        h: "About RYVON",
        paras: [
          "RYVON operates an online store selling footwear and related products to customers in India. Product images are illustrative; slight variations in colour may occur due to screen settings and lighting.",
        ],
      },
      {
        h: "Eligibility",
        paras: [
          "You confirm that you are at least 18 years old, or using the site under supervision of a parent/guardian who agrees to these terms, and that information you provide is accurate.",
        ],
      },
      {
        h: "Products, pricing & offers",
        bullets: [
          "All prices are in Indian Rupees (INR) and inclusive of applicable GST unless stated otherwise.",
          "We may change prices, discounts, or stock without prior notice. The price applicable is the one shown at the time you successfully place the order.",
          "Typographical or pricing errors may be corrected; we reserve the right to cancel orders placed at an incorrect price and refund any amount paid.",
          "Offer terms (sale, prepaid extra 5% off, free shipping thresholds) can change or end without notice.",
        ],
      },
      {
        h: "Orders & acceptance",
        paras: [
          "An order is an offer to buy. Order confirmation / Order ID indicates acknowledgement; acceptance is complete when we dispatch the product. We may refuse or cancel orders in cases of suspected fraud, address issues, stock unavailability, or force majeure.",
        ],
      },
      {
        h: "Payments",
        bullets: [
          "Accepted modes may include COD and prepaid methods shown at checkout.",
          "For COD, please keep exact change ready when possible and verify the product packaging before payment to the courier where feasible.",
          "Fraudulent payments, chargebacks without valid cause, or misuse of payment instruments may lead to order cancellation and account restrictions.",
        ],
      },
      {
        h: "Shipping, returns & cancellations",
        paras: [
          "Shipping timelines and charges are governed by our Shipping Policy. Returns, exchanges, and refunds are governed by our Returns Policy. Cancellations before dispatch are governed by our Cancellation Policy. Those policies form part of these Terms.",
        ],
      },
      {
        h: "User conduct",
        bullets: [
          "Do not misuse the website (scraping at abusive rates, introducing malware, attempting unauthorised access).",
          "Do not post unlawful, abusive, or infringing content in reviews or messages.",
          "Do not place orders with false identities or for resale in violation of our brand guidelines without written permission.",
        ],
      },
      {
        h: "Intellectual property",
        paras: [
          "All RYVON trademarks, logos, product names, artwork, photos, and website content are owned by RYVON or its licensors. You may not copy, modify, distribute, or exploit them without prior written consent, except for personal non-commercial use of browsing/purchasing.",
        ],
      },
      {
        h: "Disclaimer of warranties",
        paras: [
          "Products are described in good faith. Except for rights you have under Indian consumer protection law (including remedies for defective goods), the site and products are provided on an “as available” basis. We do not warrant uninterrupted or error-free access.",
        ],
      },
      {
        h: "Limitation of liability",
        paras: [
          "To the fullest extent permitted by law, RYVON’s liability for any claim arising from an order is limited to the amount you paid for that order. We are not liable for indirect, incidental, or consequential losses (including lost profits), except where such limitation is prohibited by law.",
        ],
      },
      {
        h: "Governing law & disputes",
        paras: [
          "These Terms are governed by the laws of India. Courts at the jurisdiction of our registered business location shall have exclusive jurisdiction, subject to any mandatory consumer-protection venue rights you may have.",
        ],
      },
      {
        h: "Contact",
        paras: [
          "Questions about these Terms: ryvonsupport@gmail.com or via the Contact Us page.",
        ],
      },
    ],
  },

  cancellation: {
    title: "Cancellation Policy",
    updated: "August 2026",
    intro:
      "This policy explains when you or RYVON can cancel an order for footwear purchased on our website, and what happens to refunds.",
    sections: [
      {
        h: "Customer-initiated cancellation",
        bullets: [
          "You may request cancellation before the order is marked Packed / Shipped on Track Order.",
          "Contact us ASAP with your Order ID via Contact Us or email ryvonsupport@gmail.com.",
          "If the order is already handed to the courier, cancellation isn’t possible — refuse delivery only for valid damage/wrong-item reasons, or use returns after delivery.",
          "Approved cancellations for prepaid orders are refunded to the original payment method within 5–7 business days (bank timelines extra).",
          "COD orders cancelled before dispatch simply aren’t charged.",
        ],
      },
      {
        h: "When we may cancel",
        bullets: [
          "Item out of stock after order placement.",
          "Pricing / tax / shipping calculation error.",
          "Incomplete, incorrect, or unverifiable address or phone.",
          "Suspected fraud, payment failure, or policy abuse (e.g. serial fake COD orders).",
          "Force majeure events (natural disasters, strikes, network outages) preventing fulfilment.",
        ],
        paras: [
          "If we cancel, any amount paid will be refunded. We’ll notify you using the email/phone shared at checkout.",
        ],
      },
      {
        h: "Partial cancellations",
        paras: [
          "For multi-item orders, we may cancel only unavailable items and ship the rest, or cancel the full order — we’ll confirm with you where practical. Shipping thresholds and prepaid discounts are recalculated for items that remain.",
        ],
      },
      {
        h: "After shipping",
        paras: [
          "Once shipped, the Returns & Refunds policy applies. Refusing delivery without a valid reason may be treated as RTO and can affect refund amount or future COD eligibility as described in Shipping Policy.",
        ],
      },
    ],
  },
};

const RELATED = [
  ["FAQs", "/faqs"],
  ["Returns & Refunds", "/returns"],
  ["Shipping", "/shipping"],
  ["Cancellation", "/cancellation"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
];

export default function Policy({ type = "faqs" }) {
  const page = PAGES[type] || PAGES.faqs;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 lg:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tss">RYVON Policies</p>
      <h1 className="font-display mt-2 text-2xl font-extrabold uppercase sm:text-3xl">{page.title}</h1>
      {page.updated && (
        <p className="mt-2 text-xs text-mute">Last updated: {page.updated}</p>
      )}
      {page.intro && (
        <p className="mt-5 text-[15px] leading-relaxed text-[#555]">{page.intro}</p>
      )}

      <div className="mt-8 space-y-8">
        {page.sections.map((sec) => (
          <section key={sec.h} className="border-b border-line pb-8 last:border-0">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-ink sm:text-[15px]">
              {sec.h}
            </h2>

            {sec.items?.map((item) => (
              <div key={item.q} className="mt-5">
                <h3 className="text-[14px] font-bold text-ink">{item.q}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#555]">{item.a}</p>
              </div>
            ))}

            {sec.paras?.map((p) => (
              <p key={p.slice(0, 48)} className="mt-3 text-[14px] leading-relaxed text-[#555]">
                {p}
              </p>
            ))}

            {sec.bullets && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#555]">
                {sec.bullets.map((b) => (
                  <li key={b.slice(0, 48)}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-line bg-wash p-5">
        <p className="text-sm font-bold uppercase tracking-wide">Need more help?</p>
        <p className="mt-1 text-[13px] text-mute">
          Email <a href="mailto:ryvonsupport@gmail.com" className="font-semibold text-tss">ryvonsupport@gmail.com</a> or{" "}
          <Link to="/contact" className="font-semibold text-tss underline">Contact support</Link>.
          Include your Order ID for faster help.
        </p>
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-bold uppercase tracking-wide text-mute">Related policies</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {RELATED.filter(([, to]) => to !== `/${type}` && !(type === "faqs" && to === "/faqs")).map(([label, to]) => (
            <Link
              key={to}
              to={to}
              onClick={() => window.scrollTo(0, 0)}
              className="border border-line bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:border-tss hover:text-tss"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
