(() => {
  "use strict";

  const CONFIG = window.KAIZEN_CONFIG || {};
  const BASE_CATALOG = Array.isArray(window.KAIZEN_PRODUCTS)
    ? window.KAIZEN_PRODUCTS
    : [];

  const PRODUCT_TABLE = CONFIG.PRODUCT_TABLE || "products";
  const IMAGE_BUCKET = CONFIG.IMAGE_BUCKET || "product-images";

  // Your Supabase setup uses public.admin_users
  const ADMIN_TABLE = CONFIG.ADMIN_TABLE || "admin_users";
  const ADMIN_ID_COLUMN = CONFIG.ADMIN_ID_COLUMN || "id";

  const $ = (selector) => document.querySelector(selector);

  let session = null;
  let products = [];
  let editing = null;

  /* ==========================================================
     HELPERS
  ========================================================== */

  function setStatus(element, message = "", isError = false) {
    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#ff6a82" : "#8f949d";
  }

  function isPlaceholder(value) {
    if (!value || typeof value !== "string") {
      return true;
    }

    const normalized = value.trim().toUpperCase();

    return (
      !normalized ||
      normalized.includes("YOUR_SUPABASE") ||
      normalized.includes("YOUR_PUBLIC") ||
      normalized.includes("YOUR_PROJECT") ||
      normalized.includes("PLACEHOLDER")
    );
  }

  function configured() {
    return (
      !isPlaceholder(CONFIG.SUPABASE_URL) &&
      !isPlaceholder(CONFIG.SUPABASE_ANON_KEY)
    );
  }

  function cleanBaseUrl(url = "") {
    return String(url).replace(/\/+$/, "");
  }

  function authHeaders(includeContentType = true) {
    const headers = {
      apikey: CONFIG.SUPABASE_ANON_KEY
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      headers.Authorization = `Bearer ${CONFIG.SUPABASE_ANON_KEY}`;
    }

    return headers;
  }

  function slugify(value = "") {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function responseMessage(
    response,
    fallback = "Request failed"
  ) {
    try {
      const data = await response.clone().json();

      return (
        data?.msg ||
        data?.message ||
        data?.error_description ||
        data?.error ||
        data?.details ||
        data?.hint ||
        fallback
      );
    } catch {
      try {
        const text = await response.text();
        return text || fallback;
      } catch {
        return fallback;
      }
    }
  }

  function saveSession(nextSession) {
    session = nextSession;

    if (session) {
      sessionStorage.setItem(
        "kaizen_admin_session",
        JSON.stringify(session)
      );
    } else {
      sessionStorage.removeItem("kaizen_admin_session");
    }
  }

  function loadStoredSession() {
    const raw = sessionStorage.getItem(
      "kaizen_admin_session"
    );

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(
        "kaizen_admin_session"
      );

      return null;
    }
  }

  function showDashboard() {
    $("#loginView")?.classList.add("hidden");
    $("#dashboard")?.classList.remove("hidden");
  }

  function showLogin() {
    $("#dashboard")?.classList.add("hidden");
    $("#loginView")?.classList.remove("hidden");
  }

  /* ==========================================================
     SUPABASE AUTH
  ========================================================== */

  async function login(email, password) {
    const url =
      `${cleanBaseUrl(CONFIG.SUPABASE_URL)}` +
      "/auth/v1/token?grant_type=password";

    const response = await fetch(url, {
      method: "POST",

      headers: {
        apikey: CONFIG.SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email: String(email || "").trim(),
        password
      })
    });

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.msg ||
        data?.message ||
        data?.error_description ||
        data?.error ||
        "Sign-in failed."
      );
    }

    if (
      !data?.access_token ||
      !data?.user?.id
    ) {
      throw new Error(
        "Supabase returned an incomplete sign-in session."
      );
    }

    return data;
  }

  async function refreshSession() {
    if (!session?.refresh_token) {
      throw new Error(
        "Your admin session has expired. Sign in again."
      );
    }

    const url =
      `${cleanBaseUrl(CONFIG.SUPABASE_URL)}` +
      "/auth/v1/token?grant_type=refresh_token";

    const response = await fetch(url, {
      method: "POST",

      headers: {
        apikey: CONFIG.SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        refresh_token: session.refresh_token
      })
    });

    const data = await response
      .json()
      .catch(() => ({}));

    if (
      !response.ok ||
      !data?.access_token
    ) {
      saveSession(null);

      throw new Error(
        data?.msg ||
        data?.message ||
        "Your admin session expired. Sign in again."
      );
    }

    saveSession(data);

    return data;
  }

  async function apiFetch(
    url,
    options = {},
    retry = true
  ) {
    const response = await fetch(
      url,
      options
    );

    if (
      response.status === 401 &&
      retry &&
      session?.refresh_token
    ) {
      await refreshSession();

      const retryOptions = {
        ...options,

        headers: {
          ...(options.headers || {}),
          Authorization:
            `Bearer ${session.access_token}`
        }
      };

      return apiFetch(
        url,
        retryOptions,
        false
      );
    }

    return response;
  }

  async function getAuthenticatedUser() {
    if (!session?.access_token) {
      throw new Error(
        "No active admin session."
      );
    }

    const response = await apiFetch(
      `${cleanBaseUrl(
        CONFIG.SUPABASE_URL
      )}/auth/v1/user`,
      {
        method: "GET",
        headers: authHeaders(false)
      }
    );

    if (!response.ok) {
      throw new Error(
        await responseMessage(
          response,
          "Could not validate your Supabase session."
        )
      );
    }

    return response.json();
  }

  async function verifyAdmin() {
    const user =
      await getAuthenticatedUser();

    if (!user?.id) {
      throw new Error(
        "Supabase could not identify the signed-in user."
      );
    }

    const query =
      `${cleanBaseUrl(
        CONFIG.SUPABASE_URL
      )}` +
      `/rest/v1/${encodeURIComponent(
        ADMIN_TABLE
      )}` +
      `?${encodeURIComponent(
        ADMIN_ID_COLUMN
      )}=eq.${encodeURIComponent(
        user.id
      )}` +
      "&select=role&limit=1";

    const response = await apiFetch(
      query,
      {
        method: "GET",
        headers: authHeaders()
      }
    );

    if (!response.ok) {
      const message =
        await responseMessage(
          response,
          `Could not verify admin access in public.${ADMIN_TABLE}.`
        );

      throw new Error(message);
    }

    const rows =
      await response.json();

    if (
      !Array.isArray(rows) ||
      rows.length === 0
    ) {
      throw new Error(
        `Signed in successfully, but this user is not listed in public.${ADMIN_TABLE}.`
      );
    }

    if (
      String(
        rows[0]?.role || ""
      ).toLowerCase() !== "admin"
    ) {
      throw new Error(
        "This account is not authorized as an admin."
      );
    }

    return user;
  }

  async function logout() {
    try {
      if (session?.access_token) {
        await fetch(
          `${cleanBaseUrl(
            CONFIG.SUPABASE_URL
          )}/auth/v1/logout`,
          {
            method: "POST",

            headers: {
              apikey:
                CONFIG.SUPABASE_ANON_KEY,

              Authorization:
                `Bearer ${session.access_token}`
            }
          }
        );
      }
    } catch {
      // Local logout still works if network logout fails.
    } finally {
      saveSession(null);
      location.reload();
    }
  }

  /* ==========================================================
     PRODUCTS
  ========================================================== */

  async function loadProducts() {
    const query =
      `${cleanBaseUrl(
        CONFIG.SUPABASE_URL
      )}` +
      `/rest/v1/${encodeURIComponent(
        PRODUCT_TABLE
      )}` +
      "?select=*&order=sort_order.asc.nullslast,name.asc";

    const response = await apiFetch(
      query,
      {
        method: "GET",
        headers: authHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(
        await responseMessage(
          response,
          "Could not load products."
        )
      );
    }

    products =
      await response.json();

    if (!Array.isArray(products)) {
      products = [];
    }

    renderProductList();
  }

  function createProductRow(product) {
    const row =
      document.createElement("div");

    row.className =
      "admin-product";

    const thumb =
      document.createElement("div");

    thumb.className =
      "admin-thumb";

    if (product.image_url) {
      const image =
        document.createElement("img");

      image.src =
        product.image_url;

      image.alt = "";
      image.loading = "lazy";

      thumb.appendChild(image);
    } else {
      thumb.textContent = "K";
    }

    const info =
      document.createElement("div");

    const title =
      document.createElement("strong");

    title.textContent =
      product.name ||
      "Untitled product";

    const small =
      document.createElement("small");

    const price =
      Number(product.price || 0)
        .toFixed(2)
        .replace(/\.00$/, "");

    small.textContent =
      `${product.category || "Uncategorized"} · $${price}` +
      (
        product.active === false
          ? " · Hidden"
          : ""
      );

    info.append(
      title,
      small
    );

    const button =
      document.createElement("button");

    button.type = "button";
    button.textContent = "Edit";

    button.addEventListener(
      "click",
      () => editProduct(product)
    );

    row.append(
      thumb,
      info,
      button
    );

    return row;
  }

  function renderProductList() {
    const list =
      $("#adminProducts");

    if (!list) return;

    list.replaceChildren();

    if (!products.length) {
      const empty =
        document.createElement("div");

      empty.className = "status";

      empty.textContent =
        "No database products yet. Import the base catalog or create a product.";

      list.appendChild(empty);

      return;
    }

    products.forEach(
      (product) => {
        list.appendChild(
          createProductRow(product)
        );
      }
    );
  }

  function preview(url) {
    const target =
      $("#imagePreview");

    if (!target) return;

    target.replaceChildren();

    if (!url) {
      const empty =
        document.createElement("span");

      empty.textContent =
        "No image";

      target.appendChild(empty);

      return;
    }

    const image =
      document.createElement("img");

    image.src = url;
    image.alt =
      "Product preview";

    image.onerror = () => {
      target.replaceChildren();

      const error =
        document.createElement("span");

      error.textContent =
        "Image could not be loaded";

      target.appendChild(error);
    };

    target.appendChild(image);
  }

  function editProduct(
    product = null
  ) {
    editing = product;

    $("#productId").value =
      product?.id ?? "";

    $("#productName").value =
      product?.name ?? "";

    $("#productSlug").value =
      product?.slug ?? "";

    $("#productPrice").value =
      product?.price ?? "";

    $("#productCategory").value =
      product?.category ||
      "Attraction";

    $("#productDescription").value =
      product?.description ?? "";

    $("#imageUrl").value =
      product?.image_url ?? "";

    $("#productActive").checked =
      product?.active !== false;

    $("#imageFile").value = "";

    setStatus(
      $("#saveStatus"),
      ""
    );

    preview(
      product?.image_url || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  /* ==========================================================
     IMAGE UPLOAD
  ========================================================== */

  function validateImage(file) {
    if (!file) return;

    const allowed =
      new Set([
        "image/png",
        "image/jpeg",
        "image/webp"
      ]);

    if (!allowed.has(file.type)) {
      throw new Error(
        "Use a PNG, JPG/JPEG or WEBP product image."
      );
    }

    const maxBytes =
      10 * 1024 * 1024;

    if (file.size > maxBytes) {
      throw new Error(
        "Product images must be 10 MB or smaller."
      );
    }
  }

  async function uploadImage(
    file,
    slug
  ) {
    validateImage(file);

    if (!slug) {
      throw new Error(
        "Add a valid product slug before uploading an image."
      );
    }

    const extension =
      (
        file.name
          .split(".")
          .pop() ||
        "jpg"
      )
        .toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ""
        ) ||
      "jpg";

    const objectPath =
      `${slug}.${extension}`;

    const bucket =
      encodeURIComponent(
        IMAGE_BUCKET
      );

    const response =
      await apiFetch(
        `${cleanBaseUrl(
          CONFIG.SUPABASE_URL
        )}` +
          `/storage/v1/object/${bucket}/${encodeURIComponent(
            objectPath
          )}`,
        {
          method: "POST",

          headers: {
            apikey:
              CONFIG.SUPABASE_ANON_KEY,

            Authorization:
              `Bearer ${session.access_token}`,

            "Content-Type":
              file.type ||
              "application/octet-stream",

            "x-upsert":
              "true"
          },

          body: file
        }
      );

    if (!response.ok) {
      throw new Error(
        await responseMessage(
          response,
          `Image upload failed. Check the ${IMAGE_BUCKET} Storage policies.`
        )
      );
    }

    return (
      `${cleanBaseUrl(
        CONFIG.SUPABASE_URL
      )}` +
      `/storage/v1/object/public/${bucket}/${encodeURIComponent(
        objectPath
      )}` +
      `?v=${Date.now()}`
    );
  }

  /* ==========================================================
     SAVE PRODUCT
  ========================================================== */

  function buildProductPayload() {
    const name =
      $("#productName")
        .value
        .trim();

    let slug =
      slugify(
        $("#productSlug").value
      );

    if (!slug) {
      slug =
        slugify(name);

      $("#productSlug").value =
        slug;
    }

    const price =
      Number(
        $("#productPrice").value
      );

    if (!name) {
      throw new Error(
        "Product name is required."
      );
    }

    if (!slug) {
      throw new Error(
        "Product slug is required."
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw new Error(
        "Enter a valid product price."
      );
    }

    return {
      name,

      slug,

      price,

      category:
        $("#productCategory").value,

      description:
        $("#productDescription")
          .value
          .trim(),

      image_url:
        $("#imageUrl")
          .value
          .trim() ||
        null,

      active:
        $("#productActive").checked,

      sort_order:
        editing?.sort_order ??
        (
          products.length
            ? Math.max(
                0,
                ...products.map(
                  (product) =>
                    Number(
                      product.sort_order
                    ) || 0
                )
              ) + 1
            : 1
        )
    };
  }

  async function saveProduct(event) {
    event.preventDefault();

    const statusElement =
      $("#saveStatus");

    const saveButton =
      $(
        "#productForm button.save"
      );

    setStatus(
      statusElement,
      "Saving…"
    );

    if (saveButton) {
      saveButton.disabled =
        true;
    }

    try {
      const payload =
        buildProductPayload();

      const imageFile =
        $("#imageFile")
          .files?.[0];

      if (imageFile) {
        payload.image_url =
          await uploadImage(
            imageFile,
            payload.slug
          );
      }

      let url;
      let method;

      if (
        editing?.id !==
          undefined &&
        editing?.id !== null
      ) {
        url =
          `${cleanBaseUrl(
            CONFIG.SUPABASE_URL
          )}` +
          `/rest/v1/${encodeURIComponent(
            PRODUCT_TABLE
          )}` +
          `?id=eq.${encodeURIComponent(
            editing.id
          )}`;

        method = "PATCH";
      } else {
        url =
          `${cleanBaseUrl(
            CONFIG.SUPABASE_URL
          )}` +
          `/rest/v1/${encodeURIComponent(
            PRODUCT_TABLE
          )}` +
          "?on_conflict=slug";

        method = "POST";
      }

      const response =
        await apiFetch(
          url,
          {
            method,

            headers: {
              ...authHeaders(),

              Prefer:
                method === "POST"
                  ? "resolution=merge-duplicates,return=representation"
                  : "return=representation"
            },

            body:
              JSON.stringify(
                payload
              )
          }
        );

      if (!response.ok) {
        throw new Error(
          await responseMessage(
            response,
            "Product save failed."
          )
        );
      }

      const savedRows =
        await response
          .json()
          .catch(() => []);

      const savedProduct =
        Array.isArray(savedRows)
          ? savedRows[0]
          : null;

      editing =
        savedProduct || {
          ...(editing || {}),
          ...payload
        };

      $("#imageUrl").value =
        payload.image_url || "";

      preview(
        payload.image_url || ""
      );

      setStatus(
        statusElement,
        "Saved. The storefront will use this product data."
      );

      await loadProducts();

      if (savedProduct) {
        const refreshed =
          products.find(
            (product) =>
              String(product.id) ===
              String(
                savedProduct.id
              )
          ) ||
          products.find(
            (product) =>
              product.slug ===
              savedProduct.slug
          );

        if (refreshed) {
          editing =
            refreshed;
        }
      }
    } catch (error) {
      console.error(
        "Kaizen admin save error:",
        error
      );

      setStatus(
        statusElement,
        error?.message ||
          "Could not save the product.",
        true
      );
    } finally {
      if (saveButton) {
        saveButton.disabled =
          false;
      }
    }
  }

  /* ==========================================================
     IMPORT BASE CATALOG
  ========================================================== */

  async function seedCatalog() {
    if (!BASE_CATALOG.length) {
      alert(
        "No base catalog was found in catalog.js."
      );

      return;
    }

    const confirmed =
      confirm(
        "Import the current Kaizen catalog into Supabase? Existing product slugs will be updated."
      );

    if (!confirmed) {
      return;
    }

    const button =
      $("#seedBtn");

    if (button) {
      button.disabled = true;
      button.textContent =
        "Importing…";
    }

    try {
      const rows =
        BASE_CATALOG.map(
          (
            product,
            index
          ) => ({
            name:
              product.name,

            slug:
              product.slug ||
              slugify(
                product.name
              ),

            category:
              product.category ||
              "Attraction",

            price:
              Number(
                product.price || 0
              ),

            description:
              product.description ||
              "",

            image_url:
              product.image_url ||
              null,

            active:
              product.active !==
              false,

            sort_order:
              product.sort_order ??
              index + 1
          })
        );

      const response =
        await apiFetch(
          `${cleanBaseUrl(
            CONFIG.SUPABASE_URL
          )}` +
            `/rest/v1/${encodeURIComponent(
              PRODUCT_TABLE
            )}` +
            "?on_conflict=slug",
          {
            method:
              "POST",

            headers: {
              ...authHeaders(),

              Prefer:
                "resolution=merge-duplicates,return=minimal"
            },

            body:
              JSON.stringify(
                rows
              )
          }
        );

      if (!response.ok) {
        throw new Error(
          await responseMessage(
            response,
            "Catalog import failed."
          )
        );
      }

      await loadProducts();

      alert(
        "Base catalog imported successfully."
      );
    } catch (error) {
      console.error(
        "Kaizen catalog import error:",
        error
      );

      alert(
        error?.message ||
          "Catalog import failed."
      );
    } finally {
      if (button) {
        button.disabled =
          false;

        button.textContent =
          "Import base catalog";
      }
    }
  }

  /* ==========================================================
     LOGIN HANDLER
  ========================================================== */

  async function handleLogin(event) {
    event.preventDefault();

    const statusElement =
      $("#loginStatus");

    const submitButton =
      $(
        "#loginForm button[type='submit'], #loginForm button"
      );

    if (!configured()) {
      setStatus(
        statusElement,
        "Add your real SUPABASE_URL and SUPABASE_ANON_KEY to config.js first.",
        true
      );

      return;
    }

    if (submitButton) {
      submitButton.disabled =
        true;
    }

    setStatus(
      statusElement,
      "Checking access…"
    );

    try {
      const nextSession =
        await login(
          $("#email").value,
          $("#password").value
        );

      saveSession(
        nextSession
      );

      const user =
        await verifyAdmin();

      showDashboard();

      const notice =
        $("#configNotice");

      if (notice) {
        notice.textContent =
          `Signed in as ${
            user.email ||
            "admin"
          }. Catalog images and product details are managed through Supabase.`;
      }

      setStatus(
        statusElement,
        ""
      );

      await loadProducts();
    } catch (error) {
      console.error(
        "Kaizen admin sign-in error:",
        error
      );

      saveSession(null);

      showLogin();

      setStatus(
        statusElement,
        error?.message ||
          "Sign-in failed.",
        true
      );
    } finally {
      if (submitButton) {
        submitButton.disabled =
          false;
      }
    }
  }

  /* ==========================================================
     EVENTS
  ========================================================== */

  function bindEvents() {
    $("#loginForm")
      ?.addEventListener(
        "submit",
        handleLogin
      );

    $("#productForm")
      ?.addEventListener(
        "submit",
        saveProduct
      );

    $("#seedBtn")
      ?.addEventListener(
        "click",
        seedCatalog
      );

    $("#newBtn")
      ?.addEventListener(
        "click",
        () =>
          editProduct(null)
      );

    $("#imageFile")
      ?.addEventListener(
        "change",
        (event) => {
          const file =
            event.target
              .files?.[0];

          if (!file) return;

          try {
            validateImage(
              file
            );

            preview(
              URL.createObjectURL(
                file
              )
            );

            setStatus(
              $("#saveStatus"),
              "Image selected. Save the product to upload it."
            );
          } catch (error) {
            event.target.value =
              "";

            setStatus(
              $("#saveStatus"),
              error.message,
              true
            );
          }
        }
      );

    $("#imageUrl")
      ?.addEventListener(
        "input",
        (event) => {
          preview(
            event.target
              .value
              .trim()
          );
        }
      );

    $("#productName")
      ?.addEventListener(
        "input",
        () => {
          if (editing) {
            return;
          }

          const slugInput =
            $("#productSlug");

          if (
            slugInput &&
            !slugInput.dataset
              .manual
          ) {
            slugInput.value =
              slugify(
                $("#productName")
                  .value
              );
          }
        }
      );

    $("#productSlug")
      ?.addEventListener(
        "input",
        (event) => {
          event.target.dataset.manual =
            event.target.value.trim()
              ? "true"
              : "";
        }
      );

    $("#logoutBtn")
      ?.addEventListener(
        "click",
        logout
      );
  }

  /* ==========================================================
     RESTORE SESSION
  ========================================================== */

  async function restoreSession() {
    if (!configured()) {
      showLogin();

      setStatus(
        $("#loginStatus"),
        "Supabase browser configuration is not set in config.js.",
        true
      );

      return;
    }

    const stored =
      loadStoredSession();

    if (!stored?.access_token) {
      showLogin();
      return;
    }

    session = stored;

    try {
      const user =
        await verifyAdmin();

      showDashboard();

      const notice =
        $("#configNotice");

      if (notice) {
        notice.textContent =
          `Private catalog control connected${
            user.email
              ? ` · ${user.email}`
              : ""
          }.`;
      }

      await loadProducts();
    } catch (error) {
      console.warn(
        "Could not restore Kaizen admin session:",
        error
      );

      saveSession(null);

      showLogin();

      setStatus(
        $("#loginStatus"),
        error?.message ===
          "Your admin session has expired. Sign in again."
          ? error.message
          : "",
        Boolean(
          error?.message
        )
      );
    }
  }

  /* ==========================================================
     START ADMIN
  ========================================================== */

  bindEvents();

  editProduct(null);

  restoreSession();
})();