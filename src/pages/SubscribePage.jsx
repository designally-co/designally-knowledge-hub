import React from "react";
import { Button } from "../design-system/index.js";
import { useNav } from "../useNav.js";

/* SubscribePage — newsletter signup.

   Adapted: the field and button stack below 26em rather than sharing a row
   neither can use, and the card's padding scales with the viewport.

   The heading is now an <h1>: this is a standalone route and previously had
   no top-level heading at all.

   Still outstanding (not a responsive issue, so not fixed here): submitting
   does not read or validate the field — an empty submission still reports
   success. See /impeccable harden. */
export function SubscribePage() {
  const onNavigate = useNav();
  const [done, setDone] = React.useState(false);

  return (
    <div className="subscribe">
      <div className="subscribe__card">
        <p className="subscribe__kicker">Spec Sheet · Newsletter</p>
        <h1 className="subscribe__title">{done ? "You're in." : "Join the list."}</h1>
        <p className="subscribe__body">
          {done
            ? "Check your inbox to confirm. First issue lands in two weeks."
            : "One case study, one practical workflow, and useful ideas about branding, design, and AI — twice a month."}
        </p>
        {!done ? (
          <div className="email-field">
            <label className="visually-hidden" htmlFor="subscribe-email">
              Email address
            </label>
            <input
              id="subscribe-email"
              className="email-field__input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter your email"
            />
            <Button onClick={() => setDone(true)}>Subscribe</Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => onNavigate("home")} iconRight="arrow-right">
            Back to reading
          </Button>
        )}
      </div>
    </div>
  );
}
