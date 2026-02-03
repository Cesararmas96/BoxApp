---
description: Systematic process to implement a new feature in the Kiosk module from backend to OWL frontend
---

**description: Systematic process to implement a new feature in the Kiosk module from backend to OWL frontend.**


Backend & Security:

Define models in Python and ensure security rules are set.


Create models/[name].py and add entry to security/ir.model.access.csv

Frontend (OWL):

Implement the reactive component and its XML template.

Create static/src/js/components/[name].js and static/src/xml/[name].xml

Registration:

Add the new files to the manifest and the POS asset bundle.

Edit __manifest__.py and add the files to data and assets

Apply and Test:

Restart Odoo with the update flag to see changes.

Run ./odoo-bin -c /home/caal2096/Documentos/odoo/v18/odoo.conf -d backyard_poc --dev xml -u pos_ai_ecommerce_kiosk_poc