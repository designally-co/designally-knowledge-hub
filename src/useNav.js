import { useNavigate } from "react-router-dom";

/* useNav — bridges the design project's imperative onNavigate(name, topic)
   convention onto real react-router routes, so page components stay close to
   their original source while gaining shareable URLs. */
export function useNav() {
  const navigate = useNavigate();
  return (name, topic = null) => {
    if (name === "article") navigate("/article");
    else if (name === "index") navigate("/browse/" + encodeURIComponent(topic || "Insights"));
    else if (name === "subscribe") navigate("/subscribe");
    else navigate("/");
  };
}
