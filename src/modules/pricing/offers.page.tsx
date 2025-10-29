import { Button } from "@/lib/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/lib/ui/card";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

export default function OffersPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('pricing.title')}</h1>
        <p className="text-lg text-muted-foreground">
          {t('pricing.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Starter Plan */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pricing.starter.name')}</CardTitle>
            <CardDescription>{t('pricing.starter.description')}</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{t('pricing.starter.price')}</span>
              <span className="text-muted-foreground">{t('pricing.starter.period')}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.starter.features.users')}
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.starter.features.storage')}
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.starter.features.support')}
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/auth/signup" className="w-full">
              <Button variant="outline" className="w-full">{t('pricing.starter.cta')}</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Professional Plan */}
        <Card className="border-primary">
          <CardHeader>
            <div className="inline-block px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full mb-2">
              {t('pricing.professional.badge')}
            </div>
            <CardTitle>{t('pricing.professional.name')}</CardTitle>
            <CardDescription>{t('pricing.professional.description')}</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{t('pricing.professional.price')}</span>
              <span className="text-muted-foreground">{t('pricing.professional.period')}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.professional.features.users')}
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.professional.features.storage')}
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.professional.features.prioritySupport')}
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.professional.features.analytics')}
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/auth/signup" className="w-full">
              <Button className="w-full">{t('pricing.professional.cta')}</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Enterprise Plan */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pricing.enterprise.name')}</CardTitle>
            <CardDescription>{t('pricing.enterprise.description')}</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{t('pricing.enterprise.custom')}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.enterprise.features.users')}
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.enterprise.features.storage')}
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.enterprise.features.phoneSupport')}
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-500" />
                {t('pricing.enterprise.features.integrations')}
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href="/contact" className="w-full">
              <Button variant="outline" className="w-full">{t('pricing.enterprise.cta')}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
