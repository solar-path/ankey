import { Link } from "wouter";
import { Button } from "@/lib/ui/button";
import { useI18n } from "@/hooks/use-i18n";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          {t('home.hero.title')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('home.hero.subtitle')}
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg">{t('home.hero.getStarted')}</Button>
          </Link>
          <Link href="/learn">
            <Button size="lg" variant="outline">{t('home.hero.learnMore')}</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <h2 className="text-3xl font-bold text-center mb-12">{t('home.features.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">{t('home.features.multiTenancy.title')}</h3>
            <p className="text-muted-foreground">
              {t('home.features.multiTenancy.description')}
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">{t('home.features.subdomain.title')}</h3>
            <p className="text-muted-foreground">
              {t('home.features.subdomain.description')}
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">{t('home.features.customizable.title')}</h3>
            <p className="text-muted-foreground">
              {t('home.features.customizable.description')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
