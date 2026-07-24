/* @ds-bundle: {"format":4,"namespace":"BrandingExplainedDesignSystem_24e200","components":[{"name":"ArticleCard","sourcePath":"components/content/ArticleCard.jsx"},{"name":"ResourceCard","sourcePath":"components/content/ResourceCard.jsx"},{"name":"SectionHeading","sourcePath":"components/content/SectionHeading.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"TopicPill","sourcePath":"components/core/TopicPill.jsx"}],"sourceHashes":{"components/content/ArticleCard.jsx":"aeb715a2c17a","components/content/ResourceCard.jsx":"0aee1554a40c","components/content/SectionHeading.jsx":"00b463d91da0","components/core/Button.jsx":"16efc402b4b6","components/core/Icon.jsx":"081e7871fcf2","components/core/IconButton.jsx":"14a214351886","components/core/Tag.jsx":"5443b69c9ba9","components/core/TopicPill.jsx":"ef01932690d7","ui_kits/website/ArticlePage.jsx":"1a9a4addb992","ui_kits/website/Footer.jsx":"9a9a2e5b8594","ui_kits/website/Header.jsx":"a02ae6624104","ui_kits/website/HomePage.jsx":"76befe88a2a4","ui_kits/website/IndexPage.jsx":"f5493fa484cc","ui_kits/website/data.js":"3d9d2a71a14d"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BrandingExplainedDesignSystem_24e200 = window.BrandingExplainedDesignSystem_24e200 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Icon.jsx
try { (() => {
/* Icon — thin wrapper over the Lucide icon set (loaded globally via CDN).
   Branding Explained uses Lucide-style thin (2px) stroke line icons for all
   functional UI glyphs. Pass a kebab-case Lucide name. */
function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  color = "currentColor",
  className = "",
  style = {}
}) {
  const lucide = typeof window !== "undefined" ? window.lucide : null;
  const pascal = String(name).replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
  const node = lucide && lucide.icons && (lucide.icons[pascal] || lucide.icons[name]) || null;
  const children = Array.isArray(node) ? node : null;
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "be-icon " + className,
    style: {
      display: "block",
      flex: "none",
      ...style
    },
    "aria-hidden": "true"
  }, children ? children.map((c, i) => React.createElement(c[0], {
    key: i,
    ...c[1]
  })) : null);
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Button — the brand's pill button. Fully-rounded, tight bold grotesque label.
   Primary is solid ink on paper; secondary is a paper/white pill with a hairline
   ink border; ghost is transparent. Optional leading/trailing Lucide icon. */
function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  href,
  onClick,
  disabled = false,
  type = "button",
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: "8px 16px",
      fontSize: 14,
      gap: 6,
      iconSize: 15
    },
    md: {
      padding: "12px 24px",
      fontSize: 16,
      gap: 8,
      iconSize: 17
    },
    lg: {
      padding: "16px 30px",
      fontSize: 17,
      gap: 9,
      iconSize: 19
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: "var(--be-ink)",
      color: "var(--be-paper)",
      border: "1px solid var(--be-ink)"
    },
    secondary: {
      background: "var(--be-white)",
      color: "var(--be-ink)",
      border: "1px solid var(--be-ink)"
    },
    ghost: {
      background: "transparent",
      color: "var(--be-ink)",
      border: "1px solid transparent"
    },
    inverse: {
      background: "var(--be-white)",
      color: "var(--be-ink)",
      border: "1px solid var(--be-white)"
    }
  };
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    padding: s.padding,
    font: "var(--font-sans)",
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    fontSize: s.fontSize,
    lineHeight: 1,
    letterSpacing: "-0.005em",
    borderRadius: "var(--radius-pill)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "transform .12s ease, opacity .15s ease, background .15s ease",
    ...(variants[variant] || variants.primary),
    ...style
  };
  const inner = /*#__PURE__*/React.createElement(React.Fragment, null, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.iconSize,
    strokeWidth: 2.25
  }), /*#__PURE__*/React.createElement("span", null, children), iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.iconSize,
    strokeWidth: 2.25
  }));
  const Tag = href ? "a" : "button";
  return /*#__PURE__*/React.createElement(Tag, _extends({}, href ? {
    href
  } : {
    type
  }, {
    onClick: disabled ? undefined : onClick,
    disabled: href ? undefined : disabled,
    style: base,
    onMouseDown: e => !disabled && (e.currentTarget.style.transform = "scale(0.97)"),
    onMouseUp: e => e.currentTarget.style.transform = "scale(1)",
    onMouseLeave: e => e.currentTarget.style.transform = "scale(1)"
  }, rest), inner);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* IconButton — circular icon-only control. Used for the "→" next-arrow on
   section headers and carousels, search, and social links. Outline on paper,
   solid on cards, or inverse on dark bands. */
function IconButton({
  icon = "arrow-right",
  size = "md",
  variant = "outline",
  label = "",
  onClick,
  href,
  style = {},
  ...rest
}) {
  const dims = {
    sm: 32,
    md: 44,
    lg: 56
  };
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };
  const d = dims[size] || dims.md;
  const variants = {
    outline: {
      background: "transparent",
      color: "var(--be-ink)",
      border: "1.5px solid var(--be-ink)"
    },
    solid: {
      background: "var(--be-ink)",
      color: "var(--be-paper)",
      border: "1.5px solid var(--be-ink)"
    },
    inverse: {
      background: "transparent",
      color: "var(--be-paper)",
      border: "1.5px solid rgba(244,237,227,0.6)"
    },
    ghost: {
      background: "var(--be-white)",
      color: "var(--be-ink)",
      border: "1.5px solid transparent"
    }
  };
  const Tag = href ? "a" : "button";
  return /*#__PURE__*/React.createElement(Tag, _extends({}, href ? {
    href
  } : {
    type: "button"
  }, {
    onClick: onClick,
    "aria-label": label || icon,
    style: {
      width: d,
      height: d,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-pill)",
      cursor: "pointer",
      transition: "transform .12s ease, background .15s ease, color .15s ease",
      ...(variants[variant] || variants.outline),
      ...style
    },
    onMouseDown: e => e.currentTarget.style.transform = "scale(0.94)",
    onMouseUp: e => e.currentTarget.style.transform = "scale(1)",
    onMouseLeave: e => e.currentTarget.style.transform = "scale(1)"
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: iconSizes[size] || iconSizes.md,
    strokeWidth: 2
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/content/SectionHeading.jsx
try { (() => {
/* SectionHeading — the large editorial serif section title used to open every
   home section ("Case Studies", "Insight", "Workflows", "Resources"). Optional
   circular next-arrow (IconButton) or a text link on the right. Set `onDark`
   for the black band. */
function SectionHeading({
  children,
  action,
  // "arrow" | node | null
  actionLabel,
  // optional text next to arrow, e.g. "See all resource"
  onArrow,
  onDark = false,
  align = "left",
  style = {}
}) {
  const color = onDark ? "var(--be-paper)" : "var(--be-ink)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: align === "center" ? "center" : "space-between",
      gap: 24,
      ...style
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--type-section)",
      color,
      margin: 0,
      letterSpacing: "0.005em"
    }
  }, children), action === "arrow" && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "arrow-right",
    variant: onDark ? "inverse" : "outline",
    onClick: onArrow,
    label: "See more"
  }), actionLabel && /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: onArrow,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 18px",
      border: "1px solid var(--border-tag)",
      borderRadius: "var(--radius-pill)",
      font: "var(--type-nav)",
      color,
      textDecoration: "none",
      whiteSpace: "nowrap"
    }
  }, actionLabel, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "arrow-right",
    size: "sm",
    variant: "ghost",
    style: {
      width: 20,
      height: 20,
      border: "none"
    }
  })), action && action !== "arrow" && action);
}
Object.assign(__ds_scope, { SectionHeading });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SectionHeading.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Tag — a small uppercase category pill with a hairline outline (no fill).
   Two tones: "ink" (neutral, used over photos & in nav article cards) and
   "warm" (rust outline + rust text, used on resource cards). */
function Tag({
  children,
  tone = "ink",
  style = {},
  ...rest
}) {
  const tones = {
    ink: {
      color: "var(--be-ink)",
      borderColor: "var(--border-tag)"
    },
    warm: {
      color: "var(--be-rust)",
      borderColor: "var(--border-tag-warm)"
    },
    onDark: {
      color: "var(--be-paper)",
      borderColor: "rgba(244,237,227,0.5)"
    }
  };
  const t = tones[tone] || tones.ink;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      padding: "5px 11px",
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: 11.5,
      lineHeight: 1,
      letterSpacing: "var(--tracking-label)",
      textTransform: "uppercase",
      borderRadius: "var(--radius-pill)",
      border: "1px solid " + t.borderColor,
      color: t.color,
      background: "transparent",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/content/ArticleCard.jsx
try { (() => {
/* ArticleCard — the core editorial unit across the site: an image on top,
   a row of category Tags, a bold sans title and a grey date. "vertical" is the
   grid/carousel form; "overlay" places the tag+title card over a large image
   (the hero form). Pass `image` (url) or leave blank for a tinted placeholder. */
function ArticleCard({
  title,
  date,
  tags = [],
  image,
  imageTint = "#e7e2da",
  ratio = "4 / 3",
  layout = "vertical",
  href = "#",
  titleSize = "sm",
  style = {}
}) {
  const titleFont = {
    sm: "var(--type-title-sm)",
    md: "var(--type-title-md)",
    lg: "var(--type-title-lg)"
  }[titleSize];
  const Media = /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%",
      aspectRatio: ratio,
      borderRadius: "var(--radius-thumb)",
      overflow: "hidden",
      background: image ? "#ddd" : imageTint,
      backgroundImage: image ? `url(${image})` : "none",
      backgroundSize: "cover",
      backgroundPosition: "center"
    }
  });
  if (layout === "overlay") {
    return /*#__PURE__*/React.createElement("a", {
      href: href,
      style: {
        display: "block",
        position: "relative",
        textDecoration: "none",
        ...style
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        width: "100%",
        aspectRatio: ratio,
        borderRadius: "var(--radius-hero)",
        overflow: "hidden",
        background: image ? "#111" : imageTint,
        backgroundImage: image ? `url(${image})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: 0,
        bottom: 0,
        maxWidth: "min(520px, 62%)",
        background: "var(--be-paper)",
        padding: "24px 28px 26px",
        borderTopRightRadius: "var(--radius-card)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 16
      }
    }, tags.map(t => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
      key: t
    }, t))), /*#__PURE__*/React.createElement("h3", {
      style: {
        font: "var(--type-title-lg)",
        color: "var(--be-ink)",
        margin: 0,
        letterSpacing: "var(--tracking-tight)"
      }
    }, title), date && /*#__PURE__*/React.createElement("p", {
      style: {
        font: "var(--type-meta)",
        color: "var(--be-ink-50)",
        margin: "14px 0 0"
      }
    }, date)));
  }
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      textDecoration: "none",
      ...style
    }
  }, Media, tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, tags.map(t => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: t
  }, t))), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: titleFont,
      color: "var(--be-ink)",
      margin: 0,
      letterSpacing: "var(--tracking-tight)",
      textWrap: "pretty"
    }
  }, title), date && /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-meta)",
      color: "var(--be-ink-50)",
      margin: 0
    }
  }, date));
}
Object.assign(__ds_scope, { ArticleCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/ArticleCard.jsx", error: String((e && e.message) || e) }); }

// components/content/ResourceCard.jsx
try { (() => {
/* ResourceCard — the downloadable-resource tile. A colored "document" panel
   (with the card title reversed out in white) sits behind a frosted
   lilac/pink glass "folder pocket". Below: warm-toned category Tags, a bold
   title and a date. `color` sets the document panel (use a brand spot color). */
function ResourceCard({
  title,
  date,
  tags = [],
  color = "var(--be-gold)",
  href = "#",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("a", {
    href: href,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      textDecoration: "none",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: "100%",
      aspectRatio: "1 / 1",
      borderRadius: "var(--radius-card)",
      overflow: "hidden",
      background: "linear-gradient(160deg,#efe6f6,#e7dcf2)",
      boxShadow: "var(--shadow-card)",
      padding: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 22,
      left: 22,
      right: 22,
      height: "52%",
      borderRadius: 10,
      background: color,
      padding: "20px 22px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--type-title-sm)",
      fontWeight: 700,
      color: "#fff",
      letterSpacing: "-0.01em",
      display: "block",
      maxWidth: "78%"
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "62%",
      background: "linear-gradient(180deg, var(--be-glass-pink), var(--be-glass-lilac))",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      borderTopLeftRadius: 40,
      borderTop: "1px solid rgba(255,255,255,0.45)",
      clipPath: "polygon(0 22%, 46% 22%, 52% 0, 100% 0, 100% 100%, 0 100%)"
    }
  })), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, tags.map(t => /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: t,
    tone: "warm"
  }, t))), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--type-title-md)",
      color: "var(--be-ink)",
      margin: 0,
      letterSpacing: "var(--tracking-tight)",
      textWrap: "pretty"
    }
  }, title), date && /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-meta)",
      color: "var(--be-ink-50)",
      margin: 0
    }
  }, date));
}
Object.assign(__ds_scope, { ResourceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/ResourceCard.jsx", error: String((e && e.message) || e) }); }

// components/core/TopicPill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* TopicPill — a white, fully-rounded "sticker" pill used in the Topics cloud.
   Larger and friendlier than Tag, with a soft shadow and an optional playful
   rotation so a cluster reads like scattered stickers. */
function TopicPill({
  children,
  size = "md",
  rotate = 0,
  active = false,
  href,
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: "8px 16px",
      fontSize: 15
    },
    md: {
      padding: "11px 22px",
      fontSize: 18
    },
    lg: {
      padding: "14px 28px",
      fontSize: 22
    }
  };
  const s = sizes[size] || sizes.md;
  const Tag = href ? "a" : "button";
  return /*#__PURE__*/React.createElement(Tag, _extends({}, href ? {
    href
  } : {
    type: "button"
  }, {
    onClick: onClick,
    style: {
      display: "inline-flex",
      alignItems: "center",
      padding: s.padding,
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: s.fontSize,
      lineHeight: 1,
      letterSpacing: "-0.01em",
      borderRadius: "var(--radius-pill)",
      border: "1px solid " + (active ? "var(--be-ink)" : "transparent"),
      background: active ? "var(--be-ink)" : "var(--be-white)",
      color: active ? "var(--be-paper)" : "var(--be-ink)",
      boxShadow: "var(--shadow-sticker)",
      transform: "rotate(" + rotate + "deg)",
      cursor: "pointer",
      whiteSpace: "nowrap",
      textDecoration: "none",
      transition: "transform .15s ease, background .15s ease",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { TopicPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/TopicPill.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ArticlePage.jsx
try { (() => {
const {
  Button,
  Tag,
  IconButton,
  ArticleCard,
  SectionHeading
} = window.BrandingExplainedDesignSystem_24e200;
function ArticlePage({
  onNavigate
}) {
  const D = window.BE_DATA;
  const S = {
    maxWidth: 820,
    margin: "0 auto",
    padding: "0 var(--page-gutter)"
  };
  return /*#__PURE__*/React.createElement("article", {
    style: {
      paddingTop: 48,
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: S
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate("home"),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: "none",
      border: "none",
      cursor: "pointer",
      font: "var(--type-nav)",
      color: "var(--be-ink-50)",
      padding: 0,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrow-left",
    size: "sm",
    variant: "outline",
    style: {
      width: 34,
      height: 34
    }
  }), " Back to home"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Tag, null, "Inspiration"), /*#__PURE__*/React.createElement(Tag, null, "Graphic Design")), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--type-title-lg)",
      color: "var(--be-ink)",
      margin: 0,
      letterSpacing: "var(--tracking-tight)"
    }
  }, "There's a spirit in everything and Maki Yamaguchi is vividly bringing them to life"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "26px 0 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      background: "var(--be-paper-deep)"
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-meta)",
      color: "var(--be-ink-50)",
      margin: 0
    }
  }, "By Naomi Reeves \xB7 16 July 2026 \xB7 6 min read"))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "36px auto 0",
      padding: "0 var(--page-gutter)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      aspectRatio: "16 / 8",
      borderRadius: "var(--radius-hero)",
      background: "#1c2733"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S,
      marginTop: 48
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-lg)",
      color: "var(--be-ink)",
      margin: "0 0 24px"
    }
  }, "Maki Yamaguchi paints the interior lives of ordinary objects \u2014 a desk lamp mid-thought, a kettle holding its breath. The work is warm, a little uncanny, and entirely sincere."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-lg)",
      color: "var(--be-ink-70)",
      margin: "0 0 24px"
    }
  }, "We spoke to Yamaguchi about animism as a design tool, why restraint reads as confidence, and how a personal illustration practice quietly reshaped an entire brand system."), /*#__PURE__*/React.createElement("figure", {
    style: {
      margin: "40px 0",
      borderLeft: "3px solid var(--be-rust)",
      paddingLeft: 28
    }
  }, /*#__PURE__*/React.createElement("blockquote", {
    style: {
      font: "var(--type-display-2)",
      fontSize: "clamp(26px,3vw,38px)",
      color: "var(--be-ink)",
      margin: 0
    }
  }, "\"If you treat every object as if it has a spirit, you stop designing at things and start designing with them.\"")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-lg)",
      color: "var(--be-ink-70)",
      margin: "0 0 24px"
    }
  }, "That principle runs through the identity work: soft grotesque type, a warm paper palette, and spot colours borrowed straight from the illustrations rather than a brand deck.")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "72px auto 0",
      padding: "0 var(--page-gutter)"
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    action: "arrow",
    onArrow: () => onNavigate("index", "Insights")
  }, "More like this"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 28,
      marginTop: 36
    }
  }, D.caseStudies.map((a, i) => /*#__PURE__*/React.createElement(ArticleCard, {
    key: i,
    title: a.title,
    date: a.date,
    tags: a.tags,
    imageTint: a.tint,
    ratio: "4 / 3",
    onClick: e => {
      e.preventDefault();
      onNavigate("article");
    },
    href: "#"
  })))));
}
window.ArticlePage = ArticlePage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ArticlePage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Footer.jsx
try { (() => {
const {
  Icon
} = window.BrandingExplainedDesignSystem_24e200;
function FootCol({
  label,
  links,
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      letterSpacing: "var(--tracking-label)",
      textTransform: "uppercase",
      color: "rgba(244,237,227,0.6)",
      margin: "0 0 20px"
    }
  }, label), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate && onNavigate("index", l);
    },
    style: {
      font: "700 20px/1 var(--font-sans)",
      color: "var(--be-paper)",
      textDecoration: "none"
    }
  }, l)))));
}
function Footer({
  onNavigate
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--be-band-ochre)",
      color: "var(--be-paper)",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "0 auto",
      padding: "72px var(--page-gutter) 40px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid rgba(244,237,227,0.35)",
      marginBottom: 56
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      fontWeight: 800,
      fontSize: 34,
      lineHeight: 1.05,
      textTransform: "uppercase",
      letterSpacing: "0.01em",
      margin: "0 0 24px"
    }
  }, "Branding", /*#__PURE__*/React.createElement("br", null), "Explained"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "700 21px/1.35 var(--font-sans)",
      maxWidth: "22ch",
      margin: 0
    }
  }, "A publication about how brands, interfaces, and creative systems are researched, designed, and built."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      letterSpacing: "var(--tracking-label)",
      textTransform: "uppercase",
      color: "rgba(244,237,227,0.6)",
      margin: "40px 0 16px"
    }
  }, "Social"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14
    }
  }, ["facebook", "instagram", "music"].map(ic => /*#__PURE__*/React.createElement("a", {
    key: ic,
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      width: 44,
      height: 44,
      borderRadius: 999,
      border: "1.5px solid rgba(244,237,227,0.7)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--be-paper)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 18
  }))))), /*#__PURE__*/React.createElement(FootCol, {
    label: "Explore",
    links: ["Case Studies", "Insights", "Workflows", "Resources"],
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement(FootCol, {
    label: "Topics",
    links: ["Branding", "UX/UI", "Typography", "AI & Design", "Figma"],
    onNavigate: onNavigate
  }), /*#__PURE__*/React.createElement(FootCol, {
    label: "Information",
    links: ["About", "Authors", "Contact", "Editorial Policy", "Newsletter Archive"],
    onNavigate: onNavigate
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 72
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-sm)",
      color: "rgba(244,237,227,0.7)",
      margin: 0
    }
  }, "\xA9 2026 Branding Explained. All rights reserved."), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: "var(--be-white)",
      color: "var(--be-ink)",
      borderRadius: 10,
      padding: "8px 14px",
      font: "700 14px/1 var(--font-sans)"
    }
  }, "\uD83C\uDDEC\uD83C\uDDE7 EN ", /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 14,
    color: "var(--be-ink)"
  })))));
}
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Header.jsx
try { (() => {
const {
  Button,
  IconButton,
  Icon
} = window.BrandingExplainedDesignSystem_24e200;
function Wordmark({
  onDark,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      background: "none",
      border: "none",
      padding: 0,
      cursor: "pointer",
      textAlign: "left",
      fontFamily: "var(--font-sans)",
      fontWeight: 800,
      fontSize: 19,
      lineHeight: 1.02,
      letterSpacing: "0.01em",
      textTransform: "uppercase",
      color: onDark ? "var(--be-paper)" : "var(--be-ink)"
    }
  }, "Branding", /*#__PURE__*/React.createElement("br", null), "Explained");
}
function Header({
  onNavigate
}) {
  const {
    nav
  } = window.BE_DATA;
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 40,
      background: "rgba(244,235,225,0.86)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--be-line)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "0 auto",
      padding: "0 var(--page-gutter)",
      height: 82,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    onClick: () => onNavigate("home")
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 30
    }
  }, nav.map(item => /*#__PURE__*/React.createElement("a", {
    key: item,
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate("index", item);
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      font: "var(--type-nav)",
      color: "var(--be-ink)",
      textDecoration: "none"
    }
  }, item, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16,
    strokeWidth: 2.5
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => onNavigate("subscribe")
  }, "Subscribe"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "search",
    variant: "ghost",
    size: "sm"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(!open),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 4,
      color: "var(--be-ink)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: open ? "x" : "menu",
    size: 24
  })))));
}
window.Header = Header;
window.Wordmark = Wordmark;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomePage.jsx
try { (() => {
const {
  Button,
  IconButton,
  Tag,
  TopicPill,
  ArticleCard,
  ResourceCard,
  SectionHeading
} = window.BrandingExplainedDesignSystem_24e200;
const Section = ({
  children,
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: "var(--page-max)",
    margin: "0 auto",
    padding: "0 var(--page-gutter)",
    ...style
  }
}, children);
function Carousel({
  items,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridAutoFlow: "column",
      gridAutoColumns: "minmax(232px, 232px)",
      gap: 24,
      overflowX: "auto",
      paddingBottom: 8,
      scrollbarWidth: "none"
    }
  }, items.map((a, i) => /*#__PURE__*/React.createElement(ArticleCard, {
    key: i,
    title: a.title,
    date: a.date,
    tags: a.tags,
    imageTint: a.tint,
    ratio: a.ratio || "3 / 4",
    onClick: onOpen,
    href: "#"
  })));
}
function HomePage({
  onNavigate
}) {
  const D = window.BE_DATA;
  const open = e => {
    if (e) e.preventDefault();
    onNavigate("article");
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingTop: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Tag, null, "Inspiration"), /*#__PURE__*/React.createElement(Tag, null, "Graphic Design")), /*#__PURE__*/React.createElement(Carousel, {
    items: D.topInspiration,
    onOpen: open
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 40,
      margin: "56px 0 8px",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--type-display-2)",
      color: "var(--be-ink-50)",
      margin: 0,
      maxWidth: "16ch"
    }
  }, "Learn how better brands are built."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      maxWidth: 560,
      justifyContent: "flex-end"
    }
  }, D.topics.slice(0, 9).map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      padding: "9px 18px",
      border: "1px solid var(--border-tag)",
      borderRadius: 999,
      font: "700 15px/1 var(--font-sans)"
    }
  }, t)), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    iconRight: "arrow-right",
    onClick: () => onNavigate("index", "Topics")
  }, "See all topics")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--be-paper-deep)",
      marginTop: 40,
      padding: "80px 0 88px"
    }
  }, /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(ArticleCard, {
    layout: "overlay",
    ratio: "21 / 9",
    title: D.hero.title,
    date: D.hero.date,
    tags: D.hero.tags,
    imageTint: D.hero.tint,
    onClick: open,
    href: "#"
  }))), /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingTop: "var(--section-gap)"
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    action: "arrow",
    onArrow: () => onNavigate("index", "Case Studies")
  }, "Case Studies"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 28,
      marginTop: 36
    }
  }, D.caseStudies.map((a, i) => /*#__PURE__*/React.createElement(ArticleCard, {
    key: i,
    title: a.title,
    date: a.date,
    tags: a.tags,
    imageTint: a.tint,
    ratio: "4 / 3",
    onClick: open,
    href: "#"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--be-cobalt)",
      borderRadius: "var(--radius-card)",
      marginTop: 48,
      padding: "30px 40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "800 26px/1.1 var(--font-sans)",
      letterSpacing: "0.01em",
      textTransform: "uppercase",
      color: "#fff",
      margin: 0
    }
  }, "Design is better when ideas connect."), /*#__PURE__*/React.createElement(Button, {
    variant: "inverse",
    onClick: () => onNavigate("subscribe")
  }, "Join now"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--be-band-lavender)",
      marginTop: "var(--section-gap)",
      padding: "72px 0 88px"
    }
  }, /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(SectionHeading, {
    action: "arrow",
    onArrow: () => onNavigate("index", "Insights")
  }, "Insight"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gridAutoRows: "auto",
      gap: 28,
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "span 2",
      gridRow: "span 2"
    }
  }, /*#__PURE__*/React.createElement(ArticleCard, {
    title: D.insight[1].title,
    date: D.insight[1].date,
    tags: D.insight[1].tags,
    imageTint: D.insight[1].tint,
    ratio: "1 / 1",
    titleSize: "md",
    onClick: open,
    href: "#"
  })), /*#__PURE__*/React.createElement(ArticleCard, {
    title: D.insight[0].title,
    date: D.insight[0].date,
    tags: D.insight[0].tags,
    imageTint: D.insight[0].tint,
    ratio: "16 / 10",
    onClick: open,
    href: "#"
  }), /*#__PURE__*/React.createElement(ArticleCard, {
    title: D.insight[2].title,
    date: D.insight[2].date,
    tags: D.insight[2].tags,
    imageTint: D.insight[2].tint,
    ratio: "16 / 10",
    onClick: open,
    href: "#"
  }), /*#__PURE__*/React.createElement(ArticleCard, {
    title: D.insight[3].title,
    date: D.insight[3].date,
    tags: D.insight[3].tags,
    imageTint: D.insight[3].tint,
    ratio: "4 / 3",
    onClick: open,
    href: "#"
  }), /*#__PURE__*/React.createElement(ArticleCard, {
    title: D.insight[4].title,
    date: D.insight[4].date,
    tags: D.insight[4].tags,
    imageTint: D.insight[4].tint,
    ratio: "4 / 3",
    onClick: open,
    href: "#"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--be-band-black)",
      padding: "56px 0 96px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 20,
      marginBottom: 40
    }
  }, ["#20321f", "#3a1230", "#101826"].map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 210,
      height: 380,
      borderRadius: 26,
      background: c,
      transform: i === 1 ? "translateY(-24px)" : "none",
      boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)"
    }
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--be-paper)",
      margin: "0 0 22px"
    }
  }, "Watch \xB7 Learn \xB7 Try"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--type-display-2)",
      color: "var(--be-paper)",
      margin: 0
    }
  }, "Fresh design ideas,", /*#__PURE__*/React.createElement("br", null), "made simple."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "700 19px/1.5 var(--font-sans)",
      color: "var(--be-paper)",
      maxWidth: "34ch",
      margin: "26px auto 32px"
    }
  }, "Follow Branding Explained for short videos about branding, design, creative tools, AI, and new technology."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "inverse",
    icon: "instagram"
  }, "Instagram"), /*#__PURE__*/React.createElement(Button, {
    variant: "inverse",
    icon: "music"
  }, "TikTok")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-meta)",
      color: "var(--text-on-dark-dim)",
      marginTop: 30
    }
  }, "New videos every week."))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--be-band-mint)",
      padding: "72px 0 var(--section-gap)"
    }
  }, /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(SectionHeading, {
    action: "arrow",
    onArrow: () => onNavigate("index", "Workflows")
  }, "Workflows"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.5fr 1fr",
      gap: 40,
      marginTop: 36,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(ArticleCard, {
    title: "The act of 'making' is at the heart of APFEL's exhibition graphics for V&A East Museum",
    date: "10 June 2026",
    tags: ["Workflow"],
    imageTint: "#c94a1e",
    ratio: "16 / 9",
    titleSize: "md",
    onClick: open,
    href: "#"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 22
    }
  }, D.caseStudies.slice(0, 3).map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 16
    },
    onClick: open
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 96,
      height: 72,
      borderRadius: 6,
      background: a.tint,
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(Tag, null, "Workflow")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "700 15px/1.3 var(--font-sans)",
      margin: 0,
      cursor: "pointer"
    }
  }, a.title)))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--be-green)",
      borderRadius: "var(--radius-card)",
      padding: "26px 30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "800 34px/1 var(--font-sans)",
      color: "#fff",
      letterSpacing: "0.01em"
    }
  }, "WORKFLOW"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrow-right",
    variant: "ghost"
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "linear-gradient(180deg, var(--be-band-mint), var(--be-band-butter))",
      padding: "72px 0 88px"
    }
  }, /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--type-section)",
      color: "var(--be-ink)",
      textAlign: "center",
      margin: "0 0 40px"
    }
  }, "Topics"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 14,
      justifyContent: "center",
      maxWidth: 900,
      margin: "0 auto"
    }
  }, D.topics.map((t, i) => /*#__PURE__*/React.createElement(TopicPill, {
    key: t,
    rotate: [-3, 2, -1, 3, 0, -2, 1, -3, 2, 0, -2, 3][i % 12],
    onClick: () => onNavigate("index", t)
  }, t))))), /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingTop: "var(--section-gap)"
    }
  }, /*#__PURE__*/React.createElement(SectionHeading, {
    actionLabel: "See all resources",
    onArrow: () => onNavigate("index", "Resources")
  }, "Resources"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 28,
      marginTop: 36
    }
  }, D.resources.map((r, i) => /*#__PURE__*/React.createElement(ResourceCard, {
    key: i,
    title: r.title,
    date: r.date,
    tags: r.tags,
    color: r.color,
    onClick: open,
    href: "#"
  })))), /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingTop: "var(--section-gap)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--be-orange)",
      borderRadius: "var(--radius-card)",
      padding: "34px 44px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "800 40px/1 var(--font-sans)",
      color: "var(--be-paper)",
      margin: 0
    }
  }, "Can stories save us?"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "700 16px/1.4 var(--font-sans)",
      color: "var(--be-paper)",
      margin: "12px 0 0"
    }
  }, "Speakers from Adobe, ustwo Games, YouTube, and Arcadis.")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "800 22px/1 var(--font-sans)",
      color: "var(--be-paper)",
      margin: "0 0 14px",
      letterSpacing: "0.02em"
    }
  }, "STORYTELLING", /*#__PURE__*/React.createElement("br", null), "SUMMIT"), /*#__PURE__*/React.createElement(Button, {
    variant: "inverse",
    iconRight: "arrow-right"
  }, "Find out more")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--be-band-mint)",
      marginTop: "var(--section-gap)",
      padding: "80px 0"
    }
  }, /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.1fr 1fr",
      gap: 48,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      letterSpacing: "var(--tracking-label)",
      textTransform: "uppercase",
      margin: "0 0 22px"
    }
  }, "Spec Sheet \xB7 Newsletter"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--type-display-2)",
      margin: 0
    }
  }, "Better design thinking,", /*#__PURE__*/React.createElement("br", null), "twice a month.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "700 22px/1.4 var(--font-sans)",
      margin: "0 0 28px"
    }
  }, "One case study, one practical workflow, and useful ideas about branding, design, and AI."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      background: "var(--be-white)",
      border: "1px solid var(--be-line)",
      borderRadius: "var(--radius-input)",
      padding: 8,
      maxWidth: 460
    }
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Enter your email",
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      font: "var(--type-body)",
      padding: "8px 12px",
      color: "var(--be-ink)"
    }
  }), /*#__PURE__*/React.createElement(Button, {
    onClick: () => onNavigate("subscribe")
  }, "Subscribe")), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-sm)",
      color: "var(--be-ink-50)",
      margin: "14px 0 0"
    }
  }, "No spam. Unsubscribe at any time."))))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--be-paper-deep)",
      padding: "88px 0",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--type-display-1)",
      color: "var(--be-ink)",
      margin: 0
    }
  }, "Stay curious.", /*#__PURE__*/React.createElement("br", null), "Make thoughtful things.")));
}
window.HomePage = HomePage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomePage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/IndexPage.jsx
try { (() => {
const {
  Tag,
  TopicPill,
  ArticleCard
} = window.BrandingExplainedDesignSystem_24e200;
function IndexPage({
  topic,
  onNavigate
}) {
  const D = window.BE_DATA;
  const all = [...D.caseStudies, ...D.insight, ...D.topInspiration];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--be-paper-deep)",
      padding: "72px 0 64px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "0 auto",
      padding: "0 var(--page-gutter)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      letterSpacing: "var(--tracking-label)",
      textTransform: "uppercase",
      color: "var(--be-ink-70)",
      margin: "0 0 16px"
    }
  }, "Browsing"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--type-display-1)",
      color: "var(--be-ink)",
      margin: 0
    }
  }, topic || "Insights"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-lg)",
      color: "var(--be-ink-70)",
      margin: "20px 0 0",
      maxWidth: "52ch"
    }
  }, "Case studies, interviews and practical ideas on ", (topic || "design").toLowerCase(), " \u2014 updated as we publish."))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--page-max)",
      margin: "0 auto",
      padding: "36px var(--page-gutter) 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 44
    }
  }, D.topics.slice(0, 8).map(t => /*#__PURE__*/React.createElement(TopicPill, {
    key: t,
    size: "sm",
    active: t === topic,
    onClick: () => onNavigate("index", t)
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 32
    }
  }, all.slice(0, 12).map((a, i) => /*#__PURE__*/React.createElement(ArticleCard, {
    key: i,
    title: a.title,
    date: a.date,
    tags: a.tags,
    imageTint: a.tint,
    ratio: "4 / 3",
    titleSize: "md",
    onClick: e => {
      e.preventDefault();
      onNavigate("article");
    },
    href: "#"
  })))));
}
window.IndexPage = IndexPage;
function SubscribePage({
  onNavigate
}) {
  const [done, setDone] = React.useState(false);
  const {
    Button
  } = window.BrandingExplainedDesignSystem_24e200;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "72vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px var(--page-gutter)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      width: "100%",
      textAlign: "center",
      background: "var(--be-white)",
      borderRadius: "var(--radius-card)",
      padding: "56px 48px",
      boxShadow: "var(--shadow-card)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-label)",
      letterSpacing: "var(--tracking-label)",
      textTransform: "uppercase",
      color: "var(--be-ink-50)",
      margin: "0 0 18px"
    }
  }, "Spec Sheet \xB7 Newsletter"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--type-display-2)",
      margin: 0
    }
  }, done ? "You're in." : "Join the list."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--type-body-lg)",
      color: "var(--be-ink-70)",
      margin: "20px 0 32px"
    }
  }, done ? "Check your inbox to confirm. First issue lands in two weeks." : "One case study, one practical workflow, and useful ideas about branding, design, and AI — twice a month."), !done ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      background: "var(--be-paper)",
      border: "1px solid var(--be-line)",
      borderRadius: "var(--radius-input)",
      padding: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Enter your email",
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      font: "var(--type-body)",
      padding: "8px 12px"
    }
  }), /*#__PURE__*/React.createElement(Button, {
    onClick: () => setDone(true)
  }, "Subscribe")) : /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => onNavigate("home"),
    iconRight: "arrow-right"
  }, "Back to reading")));
}
window.SubscribePage = SubscribePage;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/IndexPage.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
// Sample editorial content for the Branding Explained UI kit.
// Images are intentionally omitted — cards fall back to brand-tinted
// placeholders. Replace `image` with real asset URLs when available.
window.BE_DATA = {
  topInspiration: [{
    title: "Studio Patten blends visual honesty and curiosity across illustration and graphic design",
    date: "2 June 2026",
    tags: ["Inspiration", "Graphic Design"],
    tint: "#e7ded2",
    ratio: "3 / 4"
  }, {
    title: "Vanilla Chi on the death of the ego and making books that resist being read",
    date: "3 June 2026",
    tags: ["Inspiration", "Graphic Design"],
    tint: "#dfe3e6",
    ratio: "3 / 4"
  }, {
    title: "Chad Etting paints belted trousers, clapboard houses and the memories old photographs carry",
    date: "1 June 2026",
    tags: ["Art & Culture"],
    tint: "#cfc3b0",
    ratio: "3 / 4"
  }, {
    title: "Do these dupes make me look rich? Inside fashion's copy economy",
    date: "29 May 2026",
    tags: ["Insight"],
    tint: "#1f3a63",
    ratio: "3 / 4"
  }, {
    title: "Met Gala 2026: celebrities shine in avant-garde fashion",
    date: "28 May 2026",
    tags: ["Photography"],
    tint: "#7a2417",
    ratio: "3 / 4"
  }, {
    title: "Why Simon Vergély gets suspicious when things look too perfect",
    date: "27 May 2026",
    tags: ["Illustration"],
    tint: "#2f5b3a",
    ratio: "3 / 4"
  }],
  hero: {
    title: "There's a spirit in everything and Maki Yamaguchi is vividly bringing them to life",
    date: "16 July 2026",
    tags: ["Inspiration", "Graphic Design"],
    tint: "#1c2733"
  },
  caseStudies: [{
    title: "Pedro Nekoi makes surreal, saturated worlds from traffic cones and Tokyo backstreets",
    date: "17 June 2026",
    tags: ["Case Study"],
    tint: "#2b6f8c"
  }, {
    title: "Granola rebrands around a single, honest idea: eat the whole day well",
    date: "14 June 2026",
    tags: ["Branding"],
    tint: "#a7c34a"
  }, {
    title: "How a museum turned its archive into a living identity system",
    date: "11 June 2026",
    tags: ["Case Study"],
    tint: "#c98a3a"
  }, {
    title: "Why Simon Vergély gets suspicious when things look too perfect",
    date: "9 June 2026",
    tags: ["Illustration"],
    tint: "#6a4a86"
  }],
  insight: [{
    title: "Apple's new Sports app shows us exactly what good data visualisation looks like",
    date: "17 June 2026",
    tags: ["Insight"],
    tint: "#dcd7cd",
    ratio: "16 / 10"
  }, {
    title: "Pedro Nekoi makes surreal, saturated worlds from traffic cones, vintage magazines and Tokyo backstreets",
    date: "17 June 2026",
    tags: ["Inspiration", "Graphic Design"],
    tint: "#243447",
    ratio: "16 / 10"
  }, {
    title: "From train stations to hospital gardens, Lucy Grainge makes art everywhere for everyone",
    date: "17 June 2026",
    tags: ["Inspiration", "Graphic Design"],
    tint: "#4f8a3d",
    ratio: "4 / 3"
  }, {
    title: "Christie Jarvis's 3D worlds turn hand-reads and tinged with darkness",
    date: "15 June 2026",
    tags: ["Photography"],
    tint: "#2aa3a0",
    ratio: "4 / 3"
  }, {
    title: "Met Gala 2026: celebrities shine in avant-garde fashion",
    date: "12 June 2026",
    tags: ["Photography"],
    tint: "#a5341c",
    ratio: "4 / 3"
  }],
  resources: [{
    title: "The Practical Brand Strategy Starter Kit",
    date: "12 July 2026",
    tags: ["Brand Strategy", "Template"],
    color: "var(--be-gold)"
  }, {
    title: "A Simple Checklist for Better Logo Reviews",
    date: "8 July 2026",
    tags: ["Branding", "Checklist"],
    color: "var(--be-cobalt)"
  }, {
    title: "The UX Research Planning Worksheet",
    date: "24 June 2026",
    tags: ["UX/UI", "Worksheet"],
    color: "var(--be-brick)"
  }, {
    title: "24 Free Fonts for Modern Editorial Design",
    date: "1 July 2026",
    tags: ["Typography", "Free"],
    color: "var(--be-green)"
  }, {
    title: "The Rebrand Project Creative Brief",
    date: "20 June 2026",
    tags: ["Branding", "Template"],
    color: "var(--be-rust)"
  }, {
    title: "The AI Image Prompt Building Cheat Sheet",
    date: "15 June 2026",
    tags: ["AI & Design", "Cheat Sheet"],
    color: "var(--be-indigo)"
  }],
  topics: ["Graphic Design", "Illustration", "Motion", "Photography", "Advertising", "Art & Culture", "Branding", "Typography", "Digital", "Product", "Experience", "Creative Industry"],
  nav: ["Case Studies", "Insights", "Workflows", "Resources"]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

__ds_ns.ArticleCard = __ds_scope.ArticleCard;

__ds_ns.ResourceCard = __ds_scope.ResourceCard;

__ds_ns.SectionHeading = __ds_scope.SectionHeading;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.TopicPill = __ds_scope.TopicPill;

})();
