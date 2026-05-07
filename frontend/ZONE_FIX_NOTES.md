# Zone change detection fix

This frontend uses classic component fields like `loading`, `doctors`, `patients`, etc.

New Angular projects can run without Zone.js by default. In that mode, HTTP responses may update component fields but the screen may not refresh until the next user event, such as clicking the same menu item again.

This version enables Zone.js change detection so data loaded from the backend appears immediately after the API response.

After copying this frontend, run:

```bash
npm install
npm start
```

If you already had dependencies installed, run at least:

```bash
npm install zone.js
```
