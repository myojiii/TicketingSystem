const isHtmlRequest = (req) => {
  const accepts = req.accepts(["html", "json"]);
  return accepts === "html" || req.path.endsWith(".html");
};

const deny = (req, res, status, message) => {
  if (isHtmlRequest(req)) {
    return res.redirect("/");
  }
  return res.status(status).json({ message });
};

const requireAuth = (req, res, next) => {
  if (req.session?.user) return next();
  return deny(req, res, 401, "Unauthorized");
};

const requireRole = (...roles) => {
  const allowed = roles.map((r) => String(r).toLowerCase());
  return (req, res, next) => {
    if (!req.session?.user) return deny(req, res, 401, "Unauthorized");
    const role = String(req.session.user.role || "").toLowerCase();
    if (!allowed.includes(role)) return deny(req, res, 403, "Forbidden");
    return next();
  };
};

export { requireAuth, requireRole };
