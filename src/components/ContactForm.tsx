import { useState, type FormEvent } from "react";
import { contact } from "../data/site";

export default function ContactForm() {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showHelp, setShowHelp] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const subject = (form.elements.namedItem("subject") as HTMLInputElement)
      .value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement)
      .value;

    const newErrors: Record<string, boolean> = {};
    if (!subject.trim()) newErrors.subject = true;
    if (!message.trim()) newErrors.message = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const uri = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(uri, "_blank");
    setShowHelp(true);
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <input
            type="text"
            name="subject"
            placeholder={contact.subjectTxt}
            className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-text placeholder-text/50 outline-none transition-colors focus:border-accent ${
              errors.subject ? "border-error" : "border-white/10"
            }`}
            onChange={() =>
              setErrors((prev) => ({ ...prev, subject: false }))
            }
          />
        </div>
        <div className="mb-4">
          <textarea
            name="message"
            rows={6}
            placeholder={contact.messageTxt}
            className={`w-full rounded-lg border bg-white/5 px-4 py-3 text-text placeholder-text/50 outline-none transition-colors focus:border-accent ${
              errors.message ? "border-error" : "border-white/10"
            }`}
            onChange={() =>
              setErrors((prev) => ({ ...prev, message: false }))
            }
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-accent py-3 font-semibold text-bg transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          {contact.submitTxt}
        </button>
      </form>

      {showHelp && (
        <p className="mt-4 text-sm text-text/60">{contact.helpTxt}</p>
      )}
    </div>
  );
}
