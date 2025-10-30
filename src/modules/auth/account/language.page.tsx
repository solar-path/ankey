import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Languages } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";
import { Button } from "@/lib/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/card";
import { Label } from "@/lib/ui/label";

export default function LanguagePage() {
  const { t, i18n } = useTranslation();
  const { user, updateUserLanguage } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    (user?.preferredLanguage as SupportedLanguage) || i18n.language as SupportedLanguage
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update language in backend
      await updateUserLanguage(selectedLanguage);

      // Apply language immediately
      await i18n.changeLanguage(selectedLanguage);

      toast.success(t('auth.account.language.saved'));
    } catch (error: any) {
      console.error('[LanguagePage] Error saving language:', error);
      toast.error(error.message || t('auth.account.language.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = selectedLanguage !== (user?.preferredLanguage || i18n.language);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('auth.account.language.title')}</h1>
        <p className="text-muted-foreground">
          {t('auth.account.language.description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('auth.account.language.preferredLanguage')}
          </CardTitle>
          <CardDescription>
            {t('auth.account.language.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>{t('auth.account.language.selectLanguage')}</Label>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => setSelectedLanguage(code as SupportedLanguage)}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    selectedLanguage === code
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{name}</span>
                  {selectedLanguage === code && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {t('auth.account.language.currentLanguage')}: <strong>{SUPPORTED_LANGUAGES[i18n.language as SupportedLanguage]}</strong>
            </p>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
