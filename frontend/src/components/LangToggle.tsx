import { useTranslation } from "react-i18next";

export default function LangToggle() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === "en" ? "fi" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <button
      onClick={toggle}
      className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 w-8"
      title="Toggle language"
    >
      {i18n.language === "en" ? "FI" : "EN"}
    </button>
  );
}
