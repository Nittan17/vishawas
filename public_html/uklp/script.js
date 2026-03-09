/**
 * Vishwas International - UK Visa Consultants
 * Final Optimized Script: Form Handling, Meta Pixel Tracking, and UI Logic
 */

// 1. GLOBAL HELPERS (Must be accessible for inline HTML onsubmit)
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbys_RaGx6VDGp4SkPQji7KVqgaO3teYR25v4BvEXVAbZ0RmGO3QpldnZ0rcsyU1ZIxa/exec";
let initiateCheckoutTracked = false;

/**
 * Handle Form Submission
 * Fires 1 Meta Pixel Lead event and 1 Google Sheet submission per click.
 */
async function handleConsultationSubmit(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  
  const form = event.target;
  const btn =
    form.querySelector('button[type="submit"]') ||
    form.querySelector(".btn-consultation");

  if (!btn || btn.disabled) return;
  // Double check disabling to be sure
  if (btn.getAttribute("data-submitting") === "true") return;
  btn.setAttribute("data-submitting", "true");

  const originalText = btn.innerText;
  btn.innerText = "Processing...";
  btn.disabled = true;

  const formData = new URLSearchParams(new FormData(form));
  
  // Anti-bot & Validation check
  if (!formData.get("name") || !formData.get("mobile")) {
      console.warn("Validation failed: Name or mobile is empty.");
      btn.disabled = false;
      btn.innerText = originalText;
      btn.removeAttribute("data-submitting");
      return;
  }

  const visaType =
    form.querySelector('[name="visa_type"]')?.value || "UK Visa Inquiry";

  try {
    console.log("Submitting to:", GOOGLE_SCRIPT_URL);
    console.log("Data:", Object.fromEntries(formData));

    // Log the exact data being sent for debugging
    for (var pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
    }

    // 1. Submit Data to Google Sheets
    // mode: "no-cors" means we CANNOT see if it succeeded or failed (status is always 0)
    // But it allows the request to be sent without blocking.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: formData,
    });
    
    console.log("Fetch request sent (no-cors mode)");

    // 2. Fire Meta Pixel SubmitApplication Event MANUALLY
    if (typeof fbq === "function") {
      fbq("track", "SubmitApplication", {
        content_name: visaType,
        status: "Submitted",
      });
      console.log("Facebook SubmitApplication Event Tracked: Success");
    }

    // 3. Close entry popup if it was open
    const consultPopup = document.getElementById("consult-popup");
    if (consultPopup) closeModal(consultPopup);

    // 4. Reset form and show the Success (WhatsApp Redirect) Modal
    form.reset();
    showSuccessModal();
    // Keep button disabled to prevent detailed submission on success
  } catch (error) {
    console.error("Submission Error:", error);
    alert("Something went wrong. Please check your connection and try again.");
    // Reset button on error only
    btn.disabled = false;
    btn.innerText = originalText;
    btn.removeAttribute("data-submitting");
  }
}

/**
 * UI Modal Helpers
 */
function showModal(modal) {
  if (!modal) return;
  const content = modal.querySelector(".popup-modal-content");
  modal.classList.add("active");
  if (typeof gsap !== "undefined" && content) {
    gsap.fromTo(
      content,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" },
    );
  }
}

function closeModal(modal) {
  if (!modal) return;
  const content = modal.querySelector(".popup-modal-content");
  if (typeof gsap !== "undefined" && content) {
    gsap.to(content, {
      y: 50,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => modal.classList.remove("active"),
    });
  } else {
    modal.classList.remove("active");
  }
}

function showSuccessModal() {
  const successModal = document.getElementById("success-modal");
  if (successModal) showModal(successModal);
}

function closeSuccessModal() {
  const successModal = document.getElementById("success-modal");
  if (successModal) closeModal(successModal);
}

function openGenericModal(modalId) {
  showModal(document.getElementById(modalId));
}

function openConsultModal(triggerElement) {
  const modal = document.getElementById("consult-popup");
  if (!modal) return;

  const titleEl = modal.querySelector(".popup-header h3");
  const visaSelect = modal.querySelector('select[name="visa_type"]');
  const qualificationSelect = modal.querySelector('select[name="qualification"]');
  const btnText = triggerElement.innerText.toLowerCase();

  // Contextual Title & Options Setting
  if (btnText.includes("study")) {
    if (titleEl)
      titleEl.innerText = "Check My UK Study Visa Eligibility – FREE";
    
    // Set Visa Type
    if (visaSelect) {
      visaSelect.innerHTML =
        '<option value="UK Study Visa" selected>UK Study Visa</option>';
    }

    // Set Qualification Options for Study Visa
    if (qualificationSelect) {
        qualificationSelect.innerHTML = `
            <option value="" disabled selected>Highest Qualification</option>
            <option value="12th">12th</option>
            <option value="Graduate">Graduate</option>
            <option value="Postgraduate">Postgraduate</option>
        `;
    }

  } else if (btnText.includes("spouse") || btnText.includes("partner")) {
    if (titleEl)
      titleEl.innerText = "Check My UK Spouse Visa Eligibility – FREE";
    
    // Set Visa Type
    if (visaSelect) {
      visaSelect.innerHTML =
        '<option value="UK Spouse Visa" selected>UK Spouse Visa</option>';
    }

    // Set Qualification Options for Spouse Visa
    if (qualificationSelect) {
        qualificationSelect.innerHTML = `
            <option value="" disabled selected>Highest Qualification</option>
            <option value="Bachelors">Bachelors</option>
            <option value="Masters">Masters</option>
        `;
    }
  }

  // Track InitiateCheckout once per session when a form is opened
  if (typeof fbq === "function" && !initiateCheckoutTracked) {
    const isStudy = btnText.includes("study");
    const contentName = isStudy ? "Study" : "Spouse";
    const visaTypeValue = isStudy ? "UK Study Visa" : "UK Spouse Visa";

    // Fire Meta Pixel InitiateCheckout Event with value & currency to fix warning
    fbq("track", "InitiateCheckout", {
      content_name: contentName,
      status: "Form Opened",
      currency: "GBP",
      value: 0.00
    });
    console.log(`Meta Pixel: InitiateCheckout (${contentName}) Tracked`);

    initiateCheckoutTracked = true;
  }

  showModal(modal);
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function validateForm(form) {
  if (!form) return;
  const btn =
    form.querySelector('button[type="submit"]') ||
    form.querySelector(".btn-consultation");
  const requiredInputs = form.querySelectorAll(
    "input[required], select[required]",
  );
  let allFilled = true;
  requiredInputs.forEach((input) => {
    if (!input.value.trim()) allFilled = false;
  });
  if (btn) btn.disabled = !allFilled;
}

// 2. DOM INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  // Icons checking
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  } else {
    console.warn("Lucide icons not loaded");
  }

  // Marquee Content Generation
  const marquee = document.getElementById("marquee-content");
  if (marquee) {
    const item = `
            <div class="marquee-item"><i data-lucide="users"></i> 60,000+ Success Stories</div>
            <div class="marquee-item"><i data-lucide="heart"></i> UK SPOUSE VISA</div>
            <div class="marquee-item"><i data-lucide="building-2"></i> 850+ University Partners</div>
        `;
    marquee.innerHTML = item.repeat(15);
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  // Intersection Observer for Reveal Animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          if (
            entry.target.querySelector(".reveal-stagger") &&
            typeof gsap !== "undefined"
          ) {
            gsap.fromTo(
              entry.target.querySelectorAll(".reveal-stagger"),
              { y: 30, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.2,
                ease: "power2.out",
              },
            );
          }
        }
      });
    },
    { threshold: 0.1 },
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  // Spouse Visa ViewContent Tracking (On Button Click)
  let spouseViewContentTracked = false;
  const trackSpouseViewContent = () => {
    if (spouseViewContentTracked) return;

    // 1. Meta Pixel ViewContent
    if (typeof fbq === "function") {
      fbq("track", "ViewContent", {
        content_name: "Spouse Visa Section",
        content_category: "Spouse Visa",
        currency: "GBP",
        value: 0.00
      });
      console.log("Meta Pixel: ViewContent (Spouse) Tracked on Click");
    }

    spouseViewContentTracked = true;
  };

  // Attach to Hero Button
  const heroSpouseBtn = document.getElementById("hero-spouse-btn");
  if (heroSpouseBtn) {
      heroSpouseBtn.addEventListener("click", trackSpouseViewContent);
  }

  // Attach to Footer/Benefits section Button
  const footerSpouseBtn = document.getElementById("footer-spouse-btn");
  if (footerSpouseBtn) {
      footerSpouseBtn.addEventListener("click", trackSpouseViewContent);
  }

  // Info Section Read More Toggle
  const readMoreBtn = document.getElementById("read-more-btn");
  const readLessBtn = document.getElementById("read-less-btn");
  const moreContent = document.getElementById("more-content");

  if (readMoreBtn && moreContent) {
    readMoreBtn.addEventListener("click", () => {
      moreContent.style.display = "block";
      readMoreBtn.style.display = "none";
    });
  }

  if (readLessBtn && moreContent) {
    readLessBtn.addEventListener("click", () => {
      moreContent.style.display = "none";
      readMoreBtn.style.display = "inline-block";
      document
        .querySelector(".info-section")
        .scrollIntoView({ behavior: "smooth" });
    });
  }

  // Attach Validation Listeners to all forms
  document.querySelectorAll(".visa-form").forEach((form) => {
    validateForm(form); // Initial check
    form.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("input", () => validateForm(form));
      input.addEventListener("change", () => validateForm(form));
    });
  });

  // Global Event Delegation for Clicks (Modals, Links)
  document.body.addEventListener("click", function (e) {
    // Consult triggers
    const consultTrigger = e.target.closest(".open-consult-modal-trigger");
    if (consultTrigger) {
      e.preventDefault();
      openConsultModal(consultTrigger);
      return;
    }

    // Generic links (Privacy/Terms)
    const privacyLink = e.target.closest("a#open-privacy");
    const termsLink = e.target.closest("a#open-terms");
    if (privacyLink) {
      e.preventDefault();
      openGenericModal("privacy-popup");
    }
    if (termsLink) {
      e.preventDefault();
      openGenericModal("terms-popup");
    }

    // Close buttons inside modals
    const closeBtn = e.target.closest(".popup-close-btn");
    if (closeBtn) {
      e.preventDefault();
      const modal = closeBtn.closest(".popup-modal-overlay");
      if (modal) closeModal(modal);
    }

    // Overlay background clicks
    if (e.target.classList.contains("popup-modal-overlay")) {
      closeModal(e.target);
    }
  });

  // UTM Tracking Logic
  const urlParams = new URLSearchParams(window.location.search);
  const utmCampaign = urlParams.get("utm_campaign") || "";
  const utmAdset = urlParams.get("utm_adset") || "";

  document.querySelectorAll(".utm_campaign").forEach((input) => {
    input.value = utmCampaign;
  });

  document.querySelectorAll(".utm_adset").forEach((input) => {
    input.value = utmAdset;
  });
});
