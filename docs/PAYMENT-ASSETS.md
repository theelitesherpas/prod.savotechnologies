# Payment marks and trust claims

Checkout assets are self-hosted, not fetched from a visitor's browser.
Sources checked on 2026-10-20:

- `public/images/payments/razorpay.svg`: https://razorpay.com/assets/razorpay-logo.svg (official processor mark).
- `public/images/payments/visa.svg`: https://cdn.simpleicons.org/visa/1434CB (Visa network mark; not a Visa Secure certification seal).
- `public/images/payments/mastercard.svg`: https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg (network identification; not a Mastercard Identity Check / SecureCode seal).
- PCI DSS is an informational text/link with an original lock icon, not a certification seal. It links to https://razorpay.com/docs/security/. Research found that the certificate linked both by the homepage (https://www.ampcuscyber.com/certificate/razorpay-pci-dss-coc.pdf) and docs (https://razorpay.com/docs/build/browser/assets/images/pci-dss-in.pdf) says valid September 24, 2025–September 23, 2026. As of this review date it is expired, so the sourced certification seal was deliberately **not shipped** and the UI does not assert current certification.

The HTTPS lock is an original line icon, labelled “Secure connection / HTTPS
encryption”, not a third-party audit seal. Visa / Mastercard logos identify
card networks in the Razorpay payment context. Issuer authentication is
conditional; the page says “Card authentication is handled by your bank when
required.” No Savo PCI certification, endorsement by a card network, blanket
3DS coverage or fake SSL certification is claimed. Do not substitute a “Visa
Secure” or “Mastercard SecureCode” badge without verified usage/brand authority.

Processor security information and brand permissions should be reviewed periodically;
marks and certificates belong to their respective owners.
