-- Reference Data Seed Script
-- Auto-generated from country.json and industry.json

BEGIN;

-- ============================================
-- COUNTRIES (244 records)
-- ============================================

INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AF', 'Afghanistan', 'ps_AF', 'af', 'AFN', '+93', '[{"name":"Asia/Kabul"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AX', 'Åland Islands', 'sv_AX', 'sv', 'EUR', '+358-18', '[{"name":"Europe/Mariehamn"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AL', 'Albania', 'sq_AL', 'sq', 'ALL', '+355', '[{"name":"Europe/Tirane"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('DZ', 'Algeria', 'ar_DZ', 'ar', 'DZD', '+213', '[{"name":"Africa/Algiers"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AS', 'American Samoa', 'en_AS', 'en', 'USD', '+1-684', '[{"name":"Pacific/Pago_Pago"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AO', 'Angola', 'pt_AO', 'pt', 'AOA', '+244', '[{"name":"Africa/Luanda"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AI', 'Anguilla', 'en_AI', 'en', 'XCD', '+1-264', '[{"name":"America/Anguilla"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AG', 'Antigua and Barbuda', 'en_AG', 'en', 'XCD', '+1-268', '[{"name":"America/Antigua"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AR', 'Argentina', 'es_AR', 'ar', 'ARS', '+54', '[{"name":"America/Argentina/Buenos_Aires"},{"name":"America/Argentina/Catamarca"},{"name":"America/Argentina/Cordoba"},{"name":"America/Argentina/Jujuy"},{"name":"America/Argentina/La_Rioja"},{"name":"America/Argentina/Mendoza"},{"name":"America/Argentina/Rio_Gallegos"},{"name":"America/Argentina/Salta"},{"name":"America/Argentina/San_Juan"},{"name":"America/Argentina/San_Luis"},{"name":"America/Argentina/Tucuman"},{"name":"America/Argentina/Ushuaia"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AM', 'Armenia', 'hy_AM', 'am', 'AMD', '+374', '[{"name":"Asia/Yerevan"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AW', 'Aruba', 'nl_AW', 'nl', 'AWG', '+297', '[{"name":"America/Aruba"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AU', 'Australia', 'en_AU', 'en', 'AUD', '+61', '[{"name":"Antarctica/Macquarie"},{"name":"Australia/Adelaide"},{"name":"Australia/Brisbane"},{"name":"Australia/Broken_Hill"},{"name":"Australia/Currie"},{"name":"Australia/Darwin"},{"name":"Australia/Eucla"},{"name":"Australia/Hobart"},{"name":"Australia/Lindeman"},{"name":"Australia/Lord_Howe"},{"name":"Australia/Melbourne"},{"name":"Australia/Perth"},{"name":"Australia/Sydney"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AT', 'Austria', 'de_AT', 'de', 'EUR', '+43', '[{"name":"Europe/Vienna"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AZ', 'Azerbaijan', 'az_AZ', 'az', 'AZN', '+994', '[{"name":"Asia/Baku"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BS', 'Bahamas', 'en_BS', 'en', 'BSD', '+1-242', '[{"name":"America/Nassau"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BH', 'Bahrain', 'ar_BH', 'bh', 'BHD', '+973', '[{"name":"Asia/Bahrain"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BD', 'Bangladesh', 'bn_BD', 'bd', 'BDT', '+880', '[{"name":"Asia/Dhaka"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BB', 'Barbados', 'en_BB', 'en', 'BBD', '+1-246', '[{"name":"America/Barbados"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BY', 'Belarus', 'be_BY', 'be', 'BYN', '+375', '[{"name":"Europe/Minsk"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BE', 'Belgium', 'en_BE', 'be', 'EUR', '+32', '[{"name":"Europe/Brussels"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BZ', 'Belize', 'es_BZ', 'es', 'BZD', '+501', '[{"name":"America/Belize"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BJ', 'Benin', 'fr_BJ', 'bj', 'XOF', '+229', '[{"name":"Africa/Lagos"},{"name":"Africa/Porto-Novo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BM', 'Bermuda', 'en_BM', 'en', 'BMD', '+1-441', '[{"name":"Atlantic/Bermuda"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BT', 'Bhutan', 'dz_BT', 'bt', 'BTN', '+975', '[{"name":"Asia/Thimphu"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BO', 'Bolivia', 'es_BO', 'bo', 'BOB', '+591', '[{"name":"America/La_Paz"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BA', 'Bosnia and Herzegovina', 'bs_BA', 'bs', 'BAM', '+387', '[{"name":"Europe/Belgrade"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BW', 'Botswana', 'en_BW', 'bw', 'BWP', '+267', '[{"name":"Africa/Gaborone"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BR', 'Brazil', 'pt_BR', 'br', 'BRL', '+55', '[{"name":"America/Araguaina"},{"name":"America/Bahia"},{"name":"America/Belem"},{"name":"America/Boa_Vista"},{"name":"America/Campo_Grande"},{"name":"America/Cuiaba"},{"name":"America/Eirunepe"},{"name":"America/Fortaleza"},{"name":"America/Maceio"},{"name":"America/Manaus"},{"name":"America/Noronha"},{"name":"America/Porto_Velho"},{"name":"America/Recife"},{"name":"America/Rio_Branco"},{"name":"America/Santarem"},{"name":"America/Sao_Paulo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('IO', 'British Indian Ocean Territory', 'en_IO', 'en', 'USD', '+246', '[{"name":"Indian/Chagos"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('VG', 'British Virgin Islands', 'en_VG', 'en', 'USD', '+1-284', '[{"name":"America/Tortola"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BN', 'Brunei', 'ms_BN', 'bn', 'BND', '+673', '[{"name":"Asia/Brunei"},{"name":"Asia/Kuching"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BG', 'Bulgaria', 'bg_BG', 'bg', 'BGN', '+359', '[{"name":"Europe/Sofia"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BF', 'Burkina Faso', 'fr_BF', 'bf', 'XOF', '+226', '[{"name":"Africa/Abidjan"},{"name":"Africa/Ouagadougou"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BI', 'Burundi', 'fr_BI', 'bi', 'BIF', '+257', '[{"name":"Africa/Bujumbura"},{"name":"Africa/Maputo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KH', 'Cambodia', 'km_KH', 'kh', 'KHR', '+855', '[{"name":"Asia/Bangkok"},{"name":"Asia/Phnom_Penh"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CM', 'Cameroon', 'fr_CM', 'cm', 'XAF', '+237', '[{"name":"Africa/Douala"},{"name":"Africa/Lagos"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CA', 'Canada', 'en_CA', 'en', 'CAD', '+1', '[{"name":"America/Atikokan"},{"name":"America/Blanc-Sablon"},{"name":"America/Cambridge_Bay"},{"name":"America/Creston"},{"name":"America/Dawson"},{"name":"America/Dawson_Creek"},{"name":"America/Edmonton"},{"name":"America/Fort_Nelson"},{"name":"America/Glace_Bay"},{"name":"America/Goose_Bay"},{"name":"America/Halifax"},{"name":"America/Inuvik"},{"name":"America/Iqaluit"},{"name":"America/Moncton"},{"name":"America/Nipigon"},{"name":"America/Pangnirtung"},{"name":"America/Rainy_River"},{"name":"America/Rankin_Inlet"},{"name":"America/Regina"},{"name":"America/Resolute"},{"name":"America/St_Johns"},{"name":"America/Swift_Current"},{"name":"America/Thunder_Bay"},{"name":"America/Toronto"},{"name":"America/Vancouver"},{"name":"America/Whitehorse"},{"name":"America/Winnipeg"},{"name":"America/Yellowknife"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CV', 'Cape Verde', 'kea_CV', 'pt', 'CVE', '+238', '[{"name":"Atlantic/Cape_Verde"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BQ', 'Caribbean Netherlands', 'nl_BQ', 'nl', 'USD', '+599', '[{"name":"America/Kralendijk"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KY', 'Cayman Islands', 'en_KY', 'en', 'KYD', '+1-345', '[{"name":"America/Cayman"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CF', 'Central African Republic', 'fr_CF', 'cf', 'XAF', '+236', '[{"name":"Africa/Bangui"},{"name":"Africa/Lagos"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TD', 'Chad', 'fr_TD', 'fr', 'XAF', '+235', '[{"name":"Africa/Ndjamena"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CL', 'Chile', 'es_CL', 'cl', 'CLP', '+56', '[{"name":"America/Punta_Arenas"},{"name":"America/Santiago"},{"name":"Pacific/Easter"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CN', 'China', 'zh_CN', 'zh', 'CNY', '+86', '[{"name":"Asia/Shanghai"},{"name":"Asia/Urumqi"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CX', 'Christmas Island', 'en_CX', 'en', 'AUD', '+61', '[{"name":"Indian/Christmas"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CC', 'Cocos (Keeling) Islands', 'en_CC', 'en', 'AUD', '+61', '[{"name":"Indian/Cocos"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CO', 'Colombia', 'es_CO', 'co', 'COP', '+57', '[{"name":"America/Bogota"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KM', 'Comoros', 'fr_KM', 'fr', 'KMF', '+269', '[{"name":"Indian/Comoro"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CG', 'Republic of the Congo (Brazzaville)', 'fr_CG', 'cg', 'XAF', '+242', '[{"name":"Africa/Brazzaville"},{"name":"Africa/Lagos"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CD', 'Democratic Republic of the Congo (Kinshasa)', 'fr_CD', 'cd', 'CDF', '+243', '[{"name":"Africa/Kinshasa"},{"name":"Africa/Lagos"},{"name":"Africa/Lubumbashi"},{"name":"Africa/Maputo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CK', 'Cook Islands', 'en_CK', 'en', 'NZD', '+682', '[{"name":"Pacific/Rarotonga"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CR', 'Costa Rica', 'es_CR', 'cr', 'CRC', '+506', '[{"name":"America/Costa_Rica"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CI', 'Côte d''Ivoire', 'fr_CI', 'fr', 'XOF', '+225', '[{"name":"Africa/Abidjan"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('HR', 'Croatia', 'hr_HR', 'hr', 'HRK', '+385', '[{"name":"Europe/Belgrade"},{"name":"Europe/Zagreb"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CU', 'Cuba', 'es_CU', 'cu', 'CUP', '+53', '[{"name":"America/Havana"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CW', 'Curaçao', 'nl_CW', 'nl', 'ANG', '+599', '[{"name":"America/Curacao"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CY', 'Cyprus', 'en_CY', 'en', 'EUR', '+357', '[{"name":"Asia/Nicosia"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CZ', 'Czech Republic', 'cs_CZ', 'cs', 'CZK', '+420', '[{"name":"Europe/Prague"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('DK', 'Denmark', 'da_DK', 'dk', 'DKK', '+45', '[{"name":"Europe/Berlin"},{"name":"Europe/Copenhagen"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('DJ', 'Djibouti', 'fr_DJ', 'fr', 'DJF', '+253', '[{"name":"Africa/Djibouti"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('DM', 'Dominica', 'en_DM', 'en', 'XCD', '+1-767', '[{"name":"America/Dominica"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('DO', 'Dominican Republic', 'es_DO', 'es', 'DOP', '+1-809', '[{"name":"America/Santo_Domingo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('EC', 'Ecuador', 'es_EC', 'es', 'USD', '+593', '[{"name":"America/Guayaquil"},{"name":"Pacific/Galapagos"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('EG', 'Egypt', 'ar_EG', 'eg', 'EGP', '+20', '[{"name":"Africa/Cairo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SV', 'El Salvador', 'es_SV', 'es', 'USD', '+503', '[{"name":"America/El_Salvador"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GQ', 'Equatorial Guinea', 'es_GQ', 'es', 'XAF', '+240', '[{"name":"Africa/Malabo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('ER', 'Eritrea', 'en_ER', 'en', 'ERN', '+291', '[{"name":"Africa/Asmara"},{"name":"Africa/Asmara"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('EE', 'Estonia', 'et_EE', 'ee', 'EUR', '+372', '[{"name":"Europe/Tallinn"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SZ', 'Eswatini', 'en_SZ', 'en', 'SZL', '+268', '[{"name":"Africa/Mbabane"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('ET', 'Ethiopia', 'om_ET', 'et', 'ETB', '+251', '[{"name":"Africa/Addis_Ababa"},{"name":"Africa/Nairobi"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('FK', 'Falkland Islands', 'en_FK', 'en', 'FKP', '+500', '[{"name":"Atlantic/Stanley"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('FO', 'Faroe Islands', 'fo_FO', 'fo', 'DKK', '+298', '[{"name":"Atlantic/Faeroe"},{"name":"Atlantic/Faroe"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('FJ', 'Fiji', 'en_FJ', 'en', 'FJD', '+679', '[{"name":"Pacific/Fiji"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('FI', 'Finland', 'fi_FI', 'fi', 'EUR', '+358', '[{"name":"Europe/Helsinki"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('FR', 'France', 'fr_FR', 'fr', 'EUR', '+33', '[{"name":"Europe/Paris"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GF', 'French Guiana', 'fr_GF', 'fr', 'EUR', '+594', '[{"name":"America/Cayenne"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PF', 'French Polynesia', 'fr_PF', 'fr', 'XPF', '+689', '[{"name":"Pacific/Tahiti"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TF', 'French Southern Territories', 'fr_TF', 'fr', 'EUR', '+262', '[{"name":"Indian/Kerguelen"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GA', 'Gabon', 'fr_GA', 'fr', 'XAF', '+241', '[{"name":"Africa/Libreville"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GM', 'Gambia', 'en_GM', 'en', 'GMD', '+220', '[{"name":"Africa/Banjul"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GE', 'Georgia', 'ka_GE', 'ge', 'GEL', '+995', '[{"name":"Asia/Tbilisi"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('DE', 'Germany', 'de_DE', 'de', 'EUR', '+49', '[{"name":"Europe/Berlin"},{"name":"Europe/Busingen"},{"name":"Europe/Zurich"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GH', 'Ghana', 'ak_GH', 'gh', 'GHS', '+233', '[{"name":"Africa/Abidjan"},{"name":"Africa/Accra"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GI', 'Gibraltar', 'en_GI', 'en', 'GIP', '+350', '[{"name":"Europe/Gibraltar"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GR', 'Greece', 'el_GR', 'el', 'EUR', '+30', '[{"name":"Europe/Athens"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GL', 'Greenland', 'kl_GL', 'kl', 'DKK', '+299', '[{"name":"America/Godthab"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GD', 'Grenada', 'en_GD', 'en', 'XCD', '+1-473', '[{"name":"America/Grenada"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GP', 'Guadeloupe', 'fr_GP', 'fr', 'EUR', '+590', '[{"name":"America/Guadeloupe"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GU', 'Guam', 'en_GU', 'en', 'USD', '+1-671', '[{"name":"Pacific/Guam"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GT', 'Guatemala', 'es_GT', 'gt', 'GTQ', '+502', '[{"name":"America/Guatemala"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GG', 'Guernsey', 'en_GG', 'en', 'GBP', '+44-1481', '[{"name":"Europe/Guernsey"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GN', 'Guinea', 'fr_GN', 'gn', 'GNF', '+224', '[{"name":"Africa/Abidjan"},{"name":"Africa/Conakry"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GW', 'Guinea-Bissau', 'pt_GW', 'pt', 'XOF', '+245', '[{"name":"Africa/Bissau"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GY', 'Guyana', 'en_GY', 'en', 'GYD', '+592', '[{"name":"America/Guyana"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('HT', 'Haiti', 'fr_HT', 'fr', 'HTG', '+509', '[{"name":"America/Tegucigalpa"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('HN', 'Honduras', 'es_HN', 'hn', 'HNL', '+504', '[{"name":"America/Tegucigalpa"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('HK', 'Hong Kong', 'en_HK', 'hk', 'HKD', '+852', '[{"name":"Asia/Hong_Kong"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('HU', 'Hungary', 'hu_HU', 'hu', 'HUF', '+36', '[{"name":"Europe/Budapest"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('IS', 'Iceland', 'is_IS', 'is', 'ISK', '+354', '[{"name":"Africa/Abidjan"},{"name":"Atlantic/Reykjavik"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('IN', 'India', 'en_IN', 'in', 'INR', '+91', '[{"name":"Asia/Kolkata"},{"name":"Asia/Colombo"},{"name":"Asia/Kolkata"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('ID', 'Indonesia', 'id_ID', 'id', 'IDR', '+62', '[{"name":"Asia/Jakarta"},{"name":"Asia/Jayapura"},{"name":"Asia/Makassar"},{"name":"Asia/Pontianak"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('IR', 'Iran', 'fa_IR', 'ir', 'IRR', '+98', '[{"name":"Asia/Tehran"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('IQ', 'Iraq', 'ar_IQ', 'iq', 'IQD', '+964', '[{"name":"Asia/Baghdad"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('IE', 'Ireland', 'en_IE', 'en', 'EUR', '+353', '[{"name":"Europe/Dublin"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('IM', 'Isle of Man', 'en_IM', 'en', 'GBP', '+44-1624', '[{"name":"Europe/Isle_of_Man"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('IL', 'Israel', 'en_IL', 'il', 'ILS', '+972', '[{"name":"Asia/Jerusalem"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('IT', 'Italy', 'it_IT', 'it', 'EUR', '+39', '[{"name":"Europe/Rome"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('JM', 'Jamaica', 'en_JM', 'en', 'JMD', '+1-876', '[{"name":"America/Jamaica"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('JP', 'Japan', 'ja_JP', 'jp', 'JPY', '+81', '[{"name":"Asia/Tokyo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('JE', 'Jersey', 'en_JE', 'en', 'GBP', '+44-1534', '[{"name":"Europe/Jersey"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('JO', 'Jordan', 'ar_JO', 'jo', 'JOD', '+962', '[{"name":"Asia/Amman"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KZ', 'Kazakhstan', 'kk_Cyrl_KZ', 'kz', 'KZT', '+7', '[{"name":"Asia/Almaty"},{"name":"Asia/Aqtau"},{"name":"Asia/Aqtobe"},{"name":"Asia/Atyrau"},{"name":"Asia/Oral"},{"name":"Asia/Qostanay"},{"name":"Asia/Qyzylorda"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KE', 'Kenya', 'en_KE', 'ke', 'KES', '+254', '[{"name":"Africa/Nairobi"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KI', 'Kiribati', 'en_KI', 'en', 'AUD', '+686', '[{"name":"Pacific/Tarawa"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KW', 'Kuwait', 'ar_KW', 'kw', 'KWD', '+965', '[{"name":"Asia/Kuwait"},{"name":"Asia/Riyadh"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KG', 'Kyrgyzstan', 'ky_KG', 'kg', 'KGS', '+996', '[{"name":"Asia/Bishkek"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LA', 'Laos', 'lo_LA', 'la', 'LAK', '+856', '[{"name":"Asia/Bangkok"},{"name":"Asia/Vientiane"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LV', 'Latvia', 'lv_LV', 'lv', 'EUR', '+371', '[{"name":"Europe/Riga"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LB', 'Lebanon', 'ar_LB', 'lb', 'LBP', '+961', '[{"name":"Asia/Beirut"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LS', 'Lesotho', 'en_LS', 'en', 'ZAR', '+266', '[{"name":"Africa/Maseru"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LR', 'Liberia', 'en_LR', 'en', 'LRD', '+231', '[{"name":"Africa/Monrovia"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LY', 'Libya', 'ar_LY', 'ly', 'LYD', '+218', '[{"name":"Africa/Tripoli"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LI', 'Liechtenstein', 'de_LI', 'de', 'CHF', '+423', '[{"name":"Europe/Vaduz"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LT', 'Lithuania', 'lt_LT', 'lt', 'EUR', '+370', '[{"name":"Europe/Vilnius"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LU', 'Luxembourg', 'de_LU', 'lu', 'EUR', '+352', '[{"name":"Europe/Brussels"},{"name":"Europe/Luxembourg"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MO', 'Macao SAR China', 'en_MO', 'en', 'MOP', '+853', '[{"name":"Asia/Macau"},{"name":"Asia/Macau"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MG', 'Madagascar', 'fr_MG', 'fr', 'MGA', '+261', '[{"name":"Indian/Antananarivo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MW', 'Malawi', 'en_MW', 'en', 'MWK', '+265', '[{"name":"Africa/Blantyre"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MY', 'Malaysia', 'ms_MY', 'my', 'MYR', '+60', '[{"name":"Asia/Kuala_Lumpur"},{"name":"Asia/Kuching"},{"name":"Asia/Singapore"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MV', 'Maldives', 'dv_MV', 'mv', 'MVR', '+960', '[{"name":"Indian/Maldives"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('ML', 'Mali', 'fr_ML', 'fr', 'XOF', '+223', '[{"name":"Africa/Bamako"},{"name":"Africa/Timbuktu"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MT', 'Malta', 'en_MT', 'mt', 'EUR', '+356', '[{"name":"Europe/Malta"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MH', 'Marshall Islands', 'en_MH', 'en', 'USD', '+692', '[{"name":"Pacific/Kwajalein"},{"name":"Pacific/Majuro"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MQ', 'Martinique', 'fr_MQ', 'fr', 'EUR', '+596', '[{"name":"America/Martinique"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MU', 'Mauritius', 'en_MU', 'en', 'MUR', '+230', '[{"name":"Indian/Mauritius"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('YT', 'Mayotte', 'fr_YT', 'fr', 'EUR', '+262', '[{"name":"Indian/Mayotte"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MX', 'Mexico', 'es_MX', 'mx', 'MXN', '+52', '[{"name":"America/Bahia_Banderas"},{"name":"America/Cancun"},{"name":"America/Chihuahua"},{"name":"America/Ciudad_Juarez"},{"name":"America/Hermosillo"},{"name":"America/Matamoros"},{"name":"America/Mazatlan"},{"name":"America/Merida"},{"name":"America/Mexico_City"},{"name":"America/Monterrey"},{"name":"America/Ojinaga"},{"name":"America/Tijuana"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('FM', 'Micronesia', 'en_FM', 'en', 'USD', '+691', '[{"name":"Pacific/Kosrae"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MD', 'Moldova', 'ro_MD', 'md', 'MDL', '+373', '[{"name":"Europe/Chisinau"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MC', 'Monaco', 'fr_MC', 'fr', 'EUR', '+377', '[{"name":"Europe/Monaco"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MN', 'Mongolia', 'mn_MN', 'mn', 'MNT', '+976', '[{"name":"Asia/Choibalsan"},{"name":"Asia/Hovd"},{"name":"Asia/Ulaanbaatar"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('ME', 'Montenegro', 'sr_Latn_ME', 'sr', 'EUR', '+382', '[{"name":"Europe/Belgrade"},{"name":"Europe/Podgorica"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MS', 'Montserrat', 'en_MS', 'en', 'XCD', '+1-664', '[{"name":"America/Montserrat"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MA', 'Morocco', 'ar_MA', 'ma', 'MAD', '+212', '[{"name":"Africa/Casablanca"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MZ', 'Mozambique', 'mgh_MZ', 'mgh', 'MZN', '+258', '[{"name":"Africa/Maputo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MM', 'Myanmar (Burma)', 'my_MM', 'sr', 'MMK', '+95', '[{"name":"Asia/Rangoon"},{"name":"Asia/Yangon"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NA', 'Namibia', 'en_NA', 'en', 'NAD', '+264', '[{"name":"Africa/Windhoek"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NR', 'Nauru', 'en_NR', 'en', 'AUD', '+674', '[{"name":"Pacific/Nauru"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NP', 'Nepal', 'ne_NP', 'np', 'NPR', '+977', '[{"name":"Asia/Kathmandu"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NL', 'Netherlands', 'nl_NL', 'nl', 'EUR', '+31', '[{"name":"Europe/Amsterdam"},{"name":"Europe/Brussels"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AN', 'Netherlands Antilles', 'nl_AN', 'nl', 'ANG', '+599', '[{"name":"America/Curacao"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NC', 'New Caledonia', 'fr_NC', 'fr', 'XPF', '+687', '[{"name":"Pacific/Noumea"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NZ', 'New Zealand', 'en_NZ', 'nz', 'NZD', '+682', '[{"name":"Pacific/Auckland"},{"name":"Pacific/Chatham"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NI', 'Nicaragua', 'es_NI', 'es', 'NIO', '+505', '[{"name":"America/Managua"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NE', 'Niger', 'fr_NE', 'ne', 'XOF', '+227', '[{"name":"Africa/Lagos"},{"name":"Africa/Niamey"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NG', 'Nigeria', 'ig_NG', 'ng', 'NGN', '+234', '[{"name":"Africa/Lagos"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NU', 'Niue', 'en_NU', 'en', 'NZD', '+683', '[{"name":"Pacific/Niue"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NF', 'Norfolk Island', 'en_NF', 'en', 'AUD', '+672', '[{"name":"Pacific/Norfolk"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MP', 'Northern Mariana Islands', 'en_MP', 'en', 'USD', '+1-670', '[{"name":"Pacific/Saipan"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KP', 'North Korea', 'ko_KP', 'ko', 'KPW', '+850', '[{"name":"Asia/Pyongyang"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MK', 'North Macedonia', 'mk_MK', 'mk', 'MKD', '+389', '[{"name":"Europe/Skopje"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('NO', 'Norway', 'nn_NO', 'no', 'NOK', '+47', '[{"name":"Europe/Berlin"},{"name":"Europe/Oslo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('OM', 'Oman', 'ar_OM', 'om', 'OMR', '+968', '[{"name":"Asia/Dubai"},{"name":"Asia/Muscat"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PK', 'Pakistan', 'en_PK', 'pk', 'PKR', '+92', '[{"name":"Asia/Karachi"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PW', 'Palau', 'en_PW', 'en', 'USD', '+680', '[{"name":"Pacific/Palau"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PS', 'Palestinian Territories', 'ar_PS', 'ar', 'ILS', '+970', '[{"name":"Asia/Gaza"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PA', 'Panama', 'es_PA', 'es', 'PAB', '+507', '[{"name":"America/Panama"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PG', 'Papua New Guinea', 'en_PG', 'en', 'PGK', '+675', '[{"name":"Pacific/Port_Moresby"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PY', 'Paraguay', 'es_PY', 'py', 'PYG', '+595', '[{"name":"America/Asuncion"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PE', 'Peru', 'es_PE', 'pe', 'PEN', '+51', '[{"name":"America/Lima"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PH', 'Philippines', 'en_PH', 'en', 'PHP', '+63', '[{"name":"Asia/Manila"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PN', 'Pitcairn Islands', 'en_PN', 'en', 'NZD', '+64', '[{"name":"Pacific/Pitcairn"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PL', 'Poland', 'pl_PL', 'pl', 'PLN', '+48', '[{"name":"Europe/Warsaw"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PT', 'Portugal', 'pt_PT', 'pt', 'EUR', '+351', '[{"name":"Atlantic/Azores"},{"name":"Atlantic/Madeira"},{"name":"Europe/Lisbon"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PR', 'Puerto Rico', 'es_PR', 'es', 'USD', '+1-787', '[{"name":"America/Puerto_Rico"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('QA', 'Qatar', 'ar_QA', 'qa', 'QAR', '+974', '[{"name":"Asia/Qatar"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('RE', 'Réunion', 'fr_RE', 'fr', 'EUR', '+262', '[{"name":"Indian/Reunion"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('RO', 'Romania', 'ro_RO', 'ro', 'RON', '+40', '[{"name":"Europe/Bucharest"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('RU', 'Russia', 'ru_RU', 'ru', 'RUB', '+7', '[{"name":"Asia/Anadyr"},{"name":"Asia/Barnaul"},{"name":"Asia/Chita"},{"name":"Asia/Irkutsk"},{"name":"Asia/Kamchatka"},{"name":"Asia/Khandyga"},{"name":"Asia/Krasnoyarsk"},{"name":"Asia/Magadan"},{"name":"Asia/Novokuznetsk"},{"name":"Asia/Novosibirsk"},{"name":"Asia/Omsk"},{"name":"Asia/Sakhalin"},{"name":"Asia/Srednekolymsk"},{"name":"Asia/Tomsk"},{"name":"Asia/Ust-Nera"},{"name":"Asia/Vladivostok"},{"name":"Asia/Yakutsk"},{"name":"Asia/Yekaterinburg"},{"name":"Europe/Astrakhan"},{"name":"Europe/Kaliningrad"},{"name":"Europe/Kirov"},{"name":"Europe/Moscow"},{"name":"Europe/Samara"},{"name":"Europe/Saratov"},{"name":"Europe/Simferopol"},{"name":"Europe/Ulyanovsk"},{"name":"Europe/Volgograd"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('RW', 'Rwanda', 'rw_RW', 'rw', 'RWF', '+250', '[{"name":"Africa/Kigali"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('WS', 'Samoa', 'en_WS', 'en', 'WST', '+685', '[{"name":"Pacific/Apia"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SM', 'San Marino', 'it_SM', 'it', 'EUR', '+378', '[{"name":"Europe/San_Marino"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('ST', 'Sao Tome and Principe', 'pt_ST', 'pt', 'STN', '+239', '[{"name":"Africa/Sao_Tome"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SA', 'Saudi Arabia', 'ar_SA', 'sa', 'SAR', '+966', '[{"name":"Asia/Riyadh"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SN', 'Senegal', 'fr_SN', 'fr', 'XOF', '+221', '[{"name":"Africa/Dakar"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('RS', 'Serbia', 'sr_Latn_RS', 'sr', 'RSD', '+381', '[{"name":"Europe/Belgrade"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SC', 'Seychelles', 'fr_SC', 'fr', 'SCR', '+248', '[{"name":"Indian/Mahe"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SL', 'Sierra Leone', 'en_SL', 'en', 'SLL', '+232', '[{"name":"Africa/Freetown"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SG', 'Singapore', 'en_SG', 'sg', 'SGD', '+65', '[{"name":"Asia/Singapore"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SX', 'Sint Maarten', 'en_SX', 'en', 'ANG', '+721', '[{"name":"America/Curacao"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SK', 'Slovakia', 'sk_SK', 'sk', 'EUR', '+421', '[{"name":"Europe/Bratislava"},{"name":"Europe/Prague"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SI', 'Slovenia', 'sl_SI', 'si', 'EUR', '+386', '[{"name":"Europe/Belgrade"},{"name":"Europe/Ljubljana"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SB', 'Solomon Islands', 'en_SB', 'en', 'SBD', '+677', '[{"name":"Pacific/Guadalcanal"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SO', 'Somalia', 'ar_SO', 'ar', 'SOS', '+252', '[{"name":"Africa/Mogadishu"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('ZA', 'South Africa', 'en_ZA', 'za', 'ZAR', '+27', '[{"name":"Africa/Johannesburg"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KR', 'South Korea', 'ko_KR', 'kr', 'KRW', '+82', '[{"name":"Asia/Seoul"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SS', 'South Sudan', 'ar_SS', 'ar', 'SSP', '+211', '[{"name":"Africa/Juba"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('ES', 'Spain', 'eu_ES', 'es', 'EUR', '+34', '[{"name":"Africa/Ceuta"},{"name":"Atlantic/Canary"},{"name":"Europe/Madrid"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LK', 'Sri Lanka', 'si_LK', 'lk', 'LKR', '+94', '[{"name":"Asia/Colombo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('BL', 'Saint Barthélemy', 'fr_BL', 'fr', 'EUR', '+590', '[{"name":"America/St_Barthelemy"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SH', 'St. Helena', 'en_SH', 'en', 'SHP', '+290', '[{"name":"Atlantic/St_Helena"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('KN', 'Saint Kitts and Nevis', 'en_KN', 'en', 'XCD', '+1-869', '[{"name":"America/St_Kitts"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('LC', 'Saint Lucia', 'en_LC', 'en', 'XCD', '+1-758', '[{"name":"America/St_Lucia"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('MF', 'Saint Martin', 'fr_MF', 'fr', 'EUR', '+1-721', '[{"name":"America/Marigot"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('PM', 'Saint Pierre and Miquelon', 'fr_PM', 'fr', 'EUR', '+508', '[{"name":"America/Miquelon"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('VC', 'Saint Vincent and the Grenadines', 'en_VC', 'en', 'XCD', '+1-784', '[{"name":"America/St_Vincent"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SD', 'Sudan', 'ar_SD', 'sd', 'SDG', '+249', '[{"name":"Africa/Khartoum"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SR', 'Suriname', 'nl_SR', 'nl', 'SRD', '+597', '[{"name":"America/Paramaribo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SJ', 'Svalbard and Jan Mayen', 'nb_SJ', 'nb', 'NOK', '+47', '[{"name":"Arctic/Longyearbyen"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SE', 'Sweden', 'sv_SE', 'se', 'SEK', '+46', '[{"name":"Europe/Berlin"},{"name":"Europe/Stockholm"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('CH', 'Switzerland', 'de_CH', 'de', 'CHF', '+41', '[{"name":"Europe/Zurich"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('SY', 'Syria', 'ar_SY', 'ar', 'SYP', '+963', '[{"name":"Asia/Damascus"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TW', 'Taiwan', 'zh_Hant_TW', 'tw', 'TWD', '+886', '[{"name":"Asia/Taipei"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TJ', 'Tajikistan', 'tg_TJ', 'tj', 'TJS', '+992', '[{"name":"Asia/Dushanbe"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TZ', 'Tanzania', 'en_US', 'en_TZ', 'TZS', '+255', '[{"name":"Africa/Dar_es_Salaam"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TH', 'Thailand', 'th_TH', 'th', 'THB', '+66', '[{"name":"Asia/Bangkok"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TL', 'Timor-Leste', 'pt_TL', 'pt', 'USD', '+670', '[{"name":"Asia/Dili"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TG', 'Togo', 'ee_TG', 'ee', 'XOF', '+228', '[{"name":"Africa/Lome"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TK', 'Tokelau', 'en_TK', 'en', 'NZD', '+', '[{"name":"Pacific/Fakaofo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TO', 'Tonga', 'to_TO', 'to', 'TOP', '+676', '[{"name":"Pacific/Tongatapu"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TT', 'Trinidad & Tobago', 'en_TT', 'en', 'TTD', '+1-868', '[{"name":"America/Port_of_Spain"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TN', 'Tunisia', 'ar_TN', 'tn', 'TND', '+216', '[{"name":"Africa/Tunis"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TR', 'Turkey', 'tr_TR', 'tr', 'TRY', '+90', '[{"name":"Europe/Istanbul"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TM', 'Turkmenistan', 'tk_TM', 'tm', 'TMT', '+993', '[{"name":"Asia/Ashgabat"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TC', 'Turks & Caicos Islands', 'en_TC', 'en', 'USD', '+1-649', '[{"name":"America/Grand_Turk"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('TV', 'Tuvalu', 'en_TV', 'en', 'AUD', '+688', '[{"name":"Pacific/Funafuti"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('UM', 'U.S. Outlying Islands', 'en_UM', 'en', 'USD', '+1', '[{"name":"Pacific/Midway"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('VI', 'U.S. Virgin Islands', 'en_VI', 'en', 'USD', '+1-340', '[{"name":"America/St_Thomas"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('UG', 'Uganda', 'cgg_UG', 'ug', 'UGX', '+256', '[{"name":"Africa/Kampala"},{"name":"Africa/Nairobi"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('UA', 'Ukraine', 'uk_UA', 'uk', 'UAH', '+380', '[{"name":"Europe/Kyiv"},{"name":"Europe/Simferopol"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('US', 'United States', 'en_US', 'en', 'USD', '+1', '[{"name":"America/Adak"},{"name":"America/Anchorage"},{"name":"America/Boise"},{"name":"Atlantic/Bermuda"},{"name":"America/Denver"},{"name":"America/Detroit"},{"name":"America/Indiana/Indianapolis"},{"name":"America/Indiana/Knox"},{"name":"America/Indiana/Marengo"},{"name":"America/Indiana/Petersburg"},{"name":"America/Indiana/Tell_City"},{"name":"America/Indiana/Vevay"},{"name":"America/Indiana/Vincennes"},{"name":"America/Juneau"},{"name":"America/Indiana/Winamac"},{"name":"America/Kentucky/Louisville"},{"name":"America/Kentucky/Monticello"},{"name":"America/Los_Angeles"},{"name":"America/Menominee"},{"name":"America/Metlakatla"},{"name":"America/New_York"},{"name":"America/Nome"},{"name":"America/North_Dakota/Beulah"},{"name":"America/North_Dakota/Center"},{"name":"America/North_Dakota/New_Salem"},{"name":"America/Phoenix"},{"name":"America/Sitka"},{"name":"America/Yakutat"},{"name":"Pacific/Honolulu"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('AE', 'United Arab Emirates', 'ar_AE', 'ae', 'AED', '+971', '[{"name":"Asia/Dubai"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('GB', 'United Kingdom', 'en_UK', 'en', 'GBP', '+44', '[{"name":"Europe/London"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('UY', 'Uruguay', 'es_UY', 'es', 'UYU', '+598', '[{"name":"America/Montevideo"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('UZ', 'Uzbekistan', 'uz_Latn_UZ', 'uz', 'UZS', '+998', '[{"name":"Asia/Samarkand"},{"name":"Asia/Tashkent"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('VU', 'Vanuatu', 'fr_VU', 'fr', 'VUV', '+678', '[{"name":"Pacific/Efate"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('VA', 'Vatican City', 'it_VA', 'it', 'EUR', '+379', '[{"name":"Europe/Vatican"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('VE', 'Venezuela', 'es_VE', 'es', 'VES', '+58', '[{"name":"America/Caracas"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('VN', 'Vietnam', 'vi_VN', 'vi', 'VND', '+84', '[{"name":"Asia/Bangkok"},{"name":"Asia/Ho_Chi_Minh"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('WF', 'Wallis and Futuna', 'fr_WF', 'fr', 'XPF', '+681', '[{"name":"Pacific/Wallis"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('EH', 'Western Sahara', 'ar_EH', 'ar', 'MAD', '+212', '[{"name":"Africa/El_Aaiun"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('YE', 'Yemen', 'ar_YE', 'ar', 'YER', '+967', '[{"name":"Asia/Aden"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('ZM', 'Zambia', 'bem_ZM', 'bem', 'ZMW', '+260', '[{"name":"Africa/Lusaka"}]'::jsonb);
INSERT INTO countries (code, name, locale, language, currency, phone_code, timezones) VALUES ('ZW', 'Zimbabwe', 'en_ZW', 'en', 'USD', '+263', '[{"name":"Africa/Harare"}]'::jsonb);

-- ============================================
-- INDUSTRIES (170 records)
-- ============================================

INSERT INTO industries (code, title, description) VALUES (10101010, 'Oil & Gas Drilling', 'Drilling contractors or owners of drilling rigs that contract their services for drilling wells.');
INSERT INTO industries (code, title, description) VALUES (10101020, 'Oil & Gas Equipment & Services', 'Manufacturers of equipment, including drilling rigs and equipment, and providers of supplies such as fractured silica and services to companies involved in the drilling, evaluation and completion of oil and gas wells.

This Sub-Industry includes companies that provide information and data services such as seismic data collection primarily to the oil & gas industry and distributors of oil & gas equipment products.

This Sub-Industry excludes oil spill services companies classified in the Environmental & Facilities Services Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (10102010, 'Integrated Oil & Gas', 'Integrated oil companies engaged in the exploration & production of oil and gas, as well as at least one other significant activity in either refining, marketing and transportation, or chemicals.');
INSERT INTO industries (code, title, description) VALUES (10102020, 'Oil & Gas Exploration & Production', 'Companies engaged in the exploration and production of oil and gas, not classified elsewhere.');
INSERT INTO industries (code, title, description) VALUES (10102030, 'Oil & Gas Refining & Marketing', 'Companies engaged in the refining and marketing of oil, gas and/or refined products not classified in the Integrated Oil & Gas or Independent Power Producers & Energy Traders Sub-Industries.

This Sub-Industry includes companies that produce ethanol, biodiesel, and eco-diesel fuels.

This Sub-Industry excludes retail automotive stores and convenience stores that primarily sell gasoline (retail gas stations), automotive components, lubricants and related products classified in the Automotive Retail Sub-Industry under the Consumer Discretionary Sector and fuel dealers classified in the Oil & Gas Storage & Transportation Sub-Industry under the Energy Sector.');
INSERT INTO industries (code, title, description) VALUES (10102040, 'Oil & Gas Storage & Transportation', 'Companies engaged in the storage and/or transportation of oil, gas and/or refined products, including diversified midstream natural gas companies, oil and refined product pipelines, coal slurry pipelines and oil & gas shipping companies.

This Sub-Industry includes distributors and dealers of petroleum products.

This Sub-Industry excludes natural gas transmission companies that operate gas pipeline systems and associated facilities designed for gas supply to end users that are classified in the Gas Utilities Sub-Industry under the Utilities Sector.');
INSERT INTO industries (code, title, description) VALUES (10102050, 'Coal & Consumable Fuels', 'Companies primarily involved in the production and mining of coal, related products and other consumable fuels related to the generation of energy such as bituminous (thermal) coal, uranium, biomass, hydrogen, and petroleum coke.

This Sub-Industry excludes companies primarily producing gases classified in the Industrial Gases Sub-Industry and companies primarily mining for metallurgical (coking) coal used for steel production classified in the Steel Sub-Industry under the Materials Sector.');
INSERT INTO industries (code, title, description) VALUES (15101010, 'Commodity Chemicals', 'Companies that primarily produce industrial chemicals and basic chemicals.

This Sub-Industry includes plastics, synthetic fibers & filaments, synthetic rubber products, films, commodity-based paints & pigments, carbon black, explosives, petroleum lubricating oils, greases, and petrochemicals.

This Sub-Industry excludes chemical companies classified in the Diversified Chemicals, Fertilizers & Agricultural Chemicals, Industrial Gases or Specialty Chemicals Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (15101020, 'Diversified Chemicals', 'Manufacturers of a diversified range of chemical products not classified in the Industrial Gases, Commodity Chemicals, Specialty Chemicals or Fertilizers & Agricultural Chemicals Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (15101030, 'Fertilizers & Agricultural Chemicals', 'Producers of fertilizers, pesticides, potash (including potash miners) or other agriculture-related chemicals, not classified elsewhere.');
INSERT INTO industries (code, title, description) VALUES (15101040, 'Industrial Gases', 'Manufacturers of industrial gases such as Oxygen, Nitrogen, Hydrogen, Carbon Dioxide, Dry Ice, Helium, and Acetylene. 

This Sub-Industry excludes Hydrogen used for the production of energy classified in the Coal & Consumable Fuels Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (15101050, 'Specialty Chemicals', 'Companies that primarily produce high value-added chemicals used in the manufacture of a wide variety of products, including but not limited to fine chemicals, additives, advanced polymers, adhesives, sealants, and specialty paints, pigments & coatings.

This Sub-Industry includes manufacturers of fragrance and flavor chemicals used in the consumer goods industry and industrial enzyme manufacturers. 

This Sub-Industry excludes raw materials and chemicals used specifically for battery production classified in the Electrical Components and Equipment Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (15102010, 'Construction Materials', 'Manufacturers of construction materials, including sand, clay, gypsum, lime, aggregates, cement, concrete, bricks, and refractory materials.

This Sub-Industry excludes other finished or semi-finished building materials classified in the Building Products Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (15103010, 'Metal, Glass & Plastic Containers  (New Name)', 'Manufacturers of metal, glass or plastic containers, including corks and caps.

This Sub-Industry excludes manufacturers of glassware classified in the Housewares & Specialties Sub-Industry under the Consumer Discretionary Sector.');
INSERT INTO industries (code, title, description) VALUES (15103020, 'Paper & Plastic Packaging Products & Materials (New Name)', 'Manufacturers of paper and cardboard containers & packaging, plastic packaging materials, wood containers, and related packaging products.');
INSERT INTO industries (code, title, description) VALUES (15104010, 'Aluminum', 'Producers of aluminum and related products, including companies that mine or process bauxite and companies that recycle aluminum to produce finished or semi-finished products.

This Sub-Industry excludes companies that primarily produce aluminum building materials classified in the Building Products Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (15104020, 'Diversified Metals & Mining', 'Companies engaged in the diversified production or extraction of metals and minerals, not classified elsewhere.

This Sub-Industry includes nonferrous metal mining (except bauxite), salt & borate mining, phosphate rock mining, sand & gravel mining, and other diversified mining operations. It also includes providers of on-site mining services to metal miners.

This Sub-Industry excludes iron ore mining classified in the Steel Sub-Industry, bauxite mining classified in the Aluminum Sub-Industry, and coal mining classified in either the Steel or Coal & Consumable Fuels Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (15104025, 'Copper', 'Companies involved primarily in copper ore mining and companies that manufacture primary and basic copper products such as rods, tubes, and wires.

This Sub-Industry excludes manufacturers of copper wires used mainly for electrical purposes classified in the Electrical Components & Equipment Sub-Industry under the Industrials Sector.');
INSERT INTO industries (code, title, description) VALUES (15104030, 'Gold', 'Producers of gold and related products, including companies that mine or process gold and the South African finance houses which primarily invest in, but do not operate, gold mines.');
INSERT INTO industries (code, title, description) VALUES (15104040, 'Precious Metals & Minerals', 'Companies mining precious metals and minerals not classified in the Gold Sub-Industry. 

This Sub-Industry includes companies primarily mining platinum group metals, diamonds, and precious stones.');
INSERT INTO industries (code, title, description) VALUES (15104045, 'Silver', 'Companies primarily mining silver.

This Sub-Industry excludes companies classified in the Gold or Precious Metals & Minerals Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (15104050, 'Steel', 'Producers of iron and steel and related products, including iron ore mining and metallurgical (coking) coal mining used for steel production.

This Sub-Industry includes ferrous metal, iron and steel foundries.');
INSERT INTO industries (code, title, description) VALUES (15105010, 'Forest Products', 'Manufacturers of timber and related wood products.

This Sub-Industry includes timber tract operations, forest nurseries, and manufacturers of lumber and plywood for the building industry such as wood panels.');
INSERT INTO industries (code, title, description) VALUES (15105020, 'Paper Products', 'Manufacturers of all grades of paper. 

This Sub-Industry includes newsprint mills, converted paper product manufacturing, and pulp, paper & paperboard mills.

This Sub-Industry excludes companies specializing in paper packaging classified in the Paper & Plastic Packaging Products & Materials Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (20101010, 'Aerospace & Defense', 'Manufacturers of civil or military aerospace and defense equipment, parts or products, such as defense electronics and space equipment.

This Sub-Industry includes military shipbuilding and companies that offer services to the defense industry, including support services, infrastructure services, operational support services, and supply chain & logistics management.

This Sub-Industry excludes companies that offer management & technology consulting services to government & defense organizations classified in the Research & Consulting Services Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (20102010, 'Building Products', 'Manufacturers of building components and home improvement products and equipment.

This Sub-Industry excludes lumber and plywood classified in the Forest Products Sub-Industry and cement and other materials classified in the Construction Materials Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (20103010, 'Construction & Engineering', 'Companies engaged in primarily non-residential construction. 

This Sub-Industry includes civil engineering companies and large-scale contractors.

This Sub-Industry excludes companies classified in the Homebuilding Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (20104010, 'Electrical Components & Equipment', 'Companies that produce electric cables and wires, electrical components or equipment not classified in the Heavy Electrical Equipment Sub-Industry.

This Sub-Industry includes cables and wires, motors and generators (except automotive), wiring devices, electric lighting equipment, fuel cells, solar power systems, and batteries & light bulbs (except manufacturers of batteries and/or light bulbs who also market and distribute their products to end consumers). This Sub-Industry also includes raw materials and chemicals used specifically for battery production.');
INSERT INTO industries (code, title, description) VALUES (20104020, 'Heavy Electrical Equipment', 'Manufacturers of power-generating equipment and other heavy electrical equipment, including power turbines, heavy electrical machinery intended for fixed-use and large electrical systems.

This Sub-Industry includes manufacturers of engines, power transmission equipment, and turbines & turbine generator set units.

This Sub-Industry excludes cables and wires classified in the Electrical Components & Equipment Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (20105010, 'Industrial Conglomerates', 'Industrial companies with diversified business activities in three or more GICS Sectors, none of which contributes a majority of revenues. Stakes held are predominantly of a controlling nature and stake holders maintain an operational interest in the running of the subsidiaries.

This Sub-Industry excludes companies with diversified business activities across three or more GICS Sectors, none of which contributes a majority of revenues and where stakes held are predominantly of a non-controlling nature. They are classified in the Multi-Sector Holdings Sub-Industry under the Financials Sector.

This Sub-Industry also excludes mono holding companies that invest in only one specific industry and are classified in the respective Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (20106010, 'Construction Machinery & Heavy Transportation Equipment (New Name)', 'Manufacturers of heavy duty trucks, rolling machinery, earth-moving & construction equipment, and related parts.

This Sub-Industry includes non-military shipbuilding.');
INSERT INTO industries (code, title, description) VALUES (20106015, 'Agricultural & Farm Machinery', 'Companies manufacturing agricultural machinery, farm machinery, and related parts.

This Sub-Industry includes machinery used for the production of crops & agricultural livestock, agricultural tractors, planting & fertilizing machinery, fertilizer & chemical application equipment, and grain dryers & blowers.');
INSERT INTO industries (code, title, description) VALUES (20106020, 'Industrial Machinery & Supplies & Components (New Name)', 'Manufacturers of industrial machinery and industrial components.

This Sub-Industry includes companies that manufacture presses, 3D printers & related supplies, machine tools, compressors, pollution control equipment, elevators, escalators, insulators, pumps, roller bearings and other metal fabrications.');
INSERT INTO industries (code, title, description) VALUES (20107010, 'Trading Companies & Distributors', 'Trading companies and distributors of industrial equipment and products.

This Sub-Industry includes distributors of chemicals, construction materials, containers & packaging products, metals & minerals such as coal & ores, paper & forest products, building products and electrical equipment. It also includes lessors of aircraft, railcars and other transportation equipment as well as companies that engage in industrial machinery rental to other businesses. 

This Sub-Industry also includes companies distributing or wholesaling industrial equipment and products to other businesses using a proprietary online platform/website.');
INSERT INTO industries (code, title, description) VALUES (20201010, 'Commercial Printing', 'Companies providing commercial printing services.

This Sub-Industry includes printers primarily serving the media industry.');
INSERT INTO industries (code, title, description) VALUES (20201050, 'Environmental & Facilities Services', 'Companies providing environmental and facilities maintenance services. 

This Sub-Industry includes waste management, facilities management, pollution control services and carbon emission trading.

This Sub-Industry excludes large-scale water treatment systems classified in the Water Utilities Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (20201060, 'Office Services & Supplies', 'Providers of office services and manufacturers of office supplies and equipment, not classified elsewhere.

This Sub-Industry includes distributors of office equipment, products and supplies.');
INSERT INTO industries (code, title, description) VALUES (20201070, 'Diversified Support Services', 'Companies primarily providing labor oriented support services to businesses and governments.

This Sub-Industry includes companies offering airline & railway catering services, commercial cleaning services, equipment repair services, industrial maintenance services, industrial auction services, storage & warehousing services, uniform rental services, and companies engaged in storage, indexing & retrieval of physical documents. This Sub-Industry also includes debt recovery & collection companies that are hired by companies for collection from defaulters.

This Sub-Industry excludes debt collection companies that purchase debt portfolios at a discount from companies and subsequently recollect the same from the debtors and earn interest on debts, classified in the Consumer Finance Sub-Industry under the Financials Sector.');
INSERT INTO industries (code, title, description) VALUES (20201080, 'Security & Alarm Services', 'Companies providing security and protection services to business and governments.

This Sub-Industry includes companies providing services such as correctional facilities, security & alarm services, armored transportation & guarding.

This Sub-Industry excludes companies providing security software classified in the Systems Software Sub-Industry and home security services classified in the Specialized Consumer Services Sub-Industry. It also excludes companies manufacturing security system equipment classified in the Electronic Equipment & Instruments Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (20202010, 'Human Resource & Employment Services (Definition Update)', 'Companies providing business support services relating to human capital management.

This Sub-Industry includes employment agencies, employee training, payroll processing, benefit & retirement support services, corporate & job seeker recruitment services, and online job portals generating revenue from fees or commissions for offering recruitment services to companies or job seekers.

This Sub-Industry excludes job portals that mainly publish job related information and generate revenue from advertising, classified in the Interactive Media & Services Sub-Industry under the Communication Services Sector.');
INSERT INTO industries (code, title, description) VALUES (20202020, 'Research & Consulting Services', 'Companies primarily providing research and consulting services to businesses and governments, not classified elsewhere.  

This Sub-Industry includes credit bureaus & credit agencies and companies involved in management consulting services, architectural design, business information or scientific research, marketing, and testing & certification services. It also includes providers of data, content and tools for diverse industries but excludes those that provide such products primarily to the financials industry classified in the Financial Exchanges & Data Sub-Industry under the Financials Sector.

This Sub-Industry excludes companies providing information technology consulting services classified in the IT Consulting & Other Services Sub-Industry and marketing consulting services & market research companies classified in the Advertising Sub-Industry under the Communication Services Sector.');
INSERT INTO industries (code, title, description) VALUES (20202030, 'Data Processing & Outsourced Services (Sector Change, New Code & Definition Update)', 'Providers of commercial data processing and/or business process outsourcing services.

This Sub-Industry includes companies providing services for customer experience management, back-office automation, call center management, and investor communications.');
INSERT INTO industries (code, title, description) VALUES (20301010, 'Air Freight & Logistics', 'Companies providing air freight transportation, courier & logistics services, including package & mail delivery and customs agents. 

This Sub-Industry excludes companies classified in the Passenger Airlines, Marine Transportation, Cargo Ground Transportation and Passenger Ground Transportation Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (20302010, 'Passenger Airlines (New name)', 'Companies providing primarily passenger air transportation.');
INSERT INTO industries (code, title, description) VALUES (20303010, 'Marine Transportation (New Name)', 'Companies providing goods or passenger maritime transportation. 

This Sub-Industry excludes cruise-ships classified in the Hotels, Resorts & Cruise Lines Sub-Industry and oil & gas shipping companies classified in the Oil & Gas Storage & Transportation Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (20304010, 'Rail Transportation (New Name)', 'Companies providing primarily goods and passenger rail transportation.');
INSERT INTO industries (code, title, description) VALUES (20304020, 'Trucking (Discontinued)', 'Companies providing primarily goods and passenger land transportation. Includes vehicle rental and taxi companies.');
INSERT INTO industries (code, title, description) VALUES (20304030, 'Cargo Ground Transportation (New)', 'Companies providing ground transportation services for goods and freight.');
INSERT INTO industries (code, title, description) VALUES (20304040, 'Passenger Ground Transportation (New)', 'Companies providing passenger ground transportation and related services, including bus, taxi, vehicle rental, ride sharing and on-demand ride sharing platforms, and other passenger logistics.');
INSERT INTO industries (code, title, description) VALUES (20305010, 'Airport Services', 'Operators of airports and companies providing related services such as air traffic control and other support activities for air transportation.');
INSERT INTO industries (code, title, description) VALUES (20305020, 'Highways & Railtracks', 'Owners and operators of roads, tunnels and railtracks, including companies providing support activities for road transportation.');
INSERT INTO industries (code, title, description) VALUES (20305030, 'Marine Ports & Services', 'Owners and operators of marine ports, including companies providing support activities for marine transportation.');
INSERT INTO industries (code, title, description) VALUES (25101010, 'Automotive Parts & Equipment (New Name)', 'Manufacturers of parts and accessories for automobiles and motorcycles.

This Sub-Industry excludes companies classified in the Tires & Rubber Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25101020, 'Tires & Rubber', 'Manufacturers of tires and rubber.');
INSERT INTO industries (code, title, description) VALUES (25102010, 'Automobile Manufacturers', 'Companies that produce mainly passenger automobiles and light trucks.

This Sub-Industry excludes companies producing mainly motorcycles and three-wheelers classified in the Motorcycle Manufacturers Sub-Industry and heavy duty trucks classified in the Construction Machinery & Heavy Transportation Equipment Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25102020, 'Motorcycle Manufacturers', 'Companies that produce motorcycles, scooters or three-wheelers.

This Sub-Industry excludes bicycles classified in the Leisure Products Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25201010, 'Consumer Electronics', 'Manufacturers of consumer electronics products, including TVs, home audio equipment, game consoles, digital cameras, and related products.

This Sub-Industry excludes manufacturers of smartphones, personal computers, laptops and notebooks classified in the Technology Hardware, Storage & Peripherals Sub-Industry and electric household appliances classified in the Household Appliances Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25201020, 'Home Furnishings', 'Manufacturers of soft home furnishings or furniture, including upholstery, carpets and wall-coverings.');
INSERT INTO industries (code, title, description) VALUES (25201030, 'Homebuilding', 'Residential construction companies that mainly build residential units such as homes, apartments, and condominiums for the purpose of selling to homeowners.

This Sub-Industry includes manufacturers of prefabricated houses & semi-fixed manufactured homes and contractors for residential plumbing, heating, air conditioning, painting and related services.

This Sub-Industry excludes companies that develop real estate classified under the Real Estate Sector.');
INSERT INTO industries (code, title, description) VALUES (25201040, 'Household Appliances', 'Manufacturers of electric household appliances and related products.

This Sub-Industry includes manufacturers of power and hand tools, including garden improvement tools.

This Sub-Industry excludes TVs and other audio & video products classified in the Consumer Electronics Sub-Industry and personal computers classified in the Technology Hardware, Storage & Peripherals Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25201050, 'Housewares & Specialties', 'Manufacturers of durable household products, including cutlery, cookware, glassware, crystal, silverware, utensils, kitchenware and consumer specialties, not classified elsewhere.');
INSERT INTO industries (code, title, description) VALUES (25202010, 'Leisure Products', 'Manufacturers of leisure products and equipment, including sports equipment, bicycles, toys, and arcade game equipment.');
INSERT INTO industries (code, title, description) VALUES (25203010, 'Apparel, Accessories & Luxury Goods', 'Manufacturers of apparel, accessories & luxury goods.

This Sub-Industry includes companies primarily producing handbags, wallets, luggage, jewelry and watches.

This Sub-Industry excludes shoes classified in the Footwear Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25203020, 'Footwear', 'Manufacturers of footwear including sport and leather shoes.');
INSERT INTO industries (code, title, description) VALUES (25203030, 'Textiles', 'Manufacturers of textile and related products, not classified in the Apparel, Accessories & Luxury Goods, Footwear or Home Furnishings Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (25301010, 'Casinos & Gaming', 'Owners and operators of casinos & gaming facilities and resorts.

This Sub-Industry includes companies providing lottery & betting services, operators of online casino gaming & betting websites. It also includes companies that offer software for online casino gaming & betting websites and manufacturers of casino gaming equipment.

This Sub-Industry excludes manufacturers of arcade game equipment classified in the Leisure Products Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25301020, 'Hotels, Resorts & Cruise Lines', 'Owners and operators of hotels, resorts and cruise-ships.

This Sub-Industry includes travel agencies, tour operators and companies that offer travel arrangement & reservation services, including online travel agencies that charge commission on each sale for travel tickets or hotel accommodation. It also includes online marketplaces for vacations rentals and travel related data processing & outsourced services.

This Sub-Industry excludes travel information sites that mainly offer information and generate revenue mainly through advertising or subscriptions, classified in the Interactive Media & Services Sub-Industry. It also excludes casino hotels classified in the Casinos & Gaming Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25301030, 'Leisure Facilities', 'Owners and operators of leisure facilities, including sport & fitness centers, stadiums, golf courses and amusement parks, not classified in the Movies & Entertainment Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25301040, 'Restaurants', 'Owners and operators of restaurants, bars, pubs, fast-food or take-out facilities.

This Sub-Industry includes food delivery companies and providers of food catering services to end consumers.');
INSERT INTO industries (code, title, description) VALUES (25302010, 'Education Services', 'Companies providing educational services, either on-line or through conventional teaching methods.

This Sub-Industry includes private universities, correspondence teaching, providers of educational seminars, educational materials and technical education.

This Sub-Industry excludes companies providing employee education programs classified in the Human Resources & Employment Services Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25302020, 'Specialized Consumer Services', 'Companies providing consumer services such as home security services, consumer legal services, personal care services, residential renovation & interior design services, consumer auctions, day care centers and wedding & funeral services.');
INSERT INTO industries (code, title, description) VALUES (25501010, 'Distributors', 'Distributors and wholesalers of consumer merchandise, not classified elsewhere, including automobile distributors.

This Sub-Industry includes companies distributing or wholesaling consumer merchandise to other businesses using a proprietary online platform/website.');
INSERT INTO industries (code, title, description) VALUES (25502020, 'Internet & Direct Marketing Retail (Discontinued)', 'Companies providing  retail  services  primarily  on  the Internet, through mail order, and TV home shopping retailers. Also includes companies providing online marketplaces for consumer products and services.');
INSERT INTO industries (code, title, description) VALUES (25503010, 'Department Stores (Discontinued)', 'Owners and operators of department stores.');
INSERT INTO industries (code, title, description) VALUES (25503020, 'General Merchandise Stores (Discontinued)', 'Owners and operators of stores offering diversified general merchandise. Excludes hypermarkets and large-scale super centers classified in the Hypermarkets & Super Centers Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (25503030, 'Broadline Retail (New)', 'Retailers offering a wide range of consumer discretionary merchandise.

This Sub-Industry includes general and discount merchandise retailers, department stores and on-line retailers and marketplaces selling mostly consumer discretionary merchandise.');
INSERT INTO industries (code, title, description) VALUES (25504010, 'Apparel Retail', 'Retailers of apparel, footwear, luggage and other accessories. 

This Sub-Industry includes apparel manufactures that primarily sell through their own retail channels.');
INSERT INTO industries (code, title, description) VALUES (25504020, 'Computer & Electronics Retail', 'Retailers of consumer electronics, computers, smartphones, and related products.');
INSERT INTO industries (code, title, description) VALUES (25504030, 'Home Improvement Retail', 'Retailers of home & garden improvement products, including building materials and related supplies.

This Sub-Industry includes companies that offer household goods repair & maintenance services.');
INSERT INTO industries (code, title, description) VALUES (25504040, 'Other Specialty Retail (New Name)', 'Retailers of other consumer products, not classified elsewhere, such as jewelry, perfumes, cosmetics, toys, office supplies, health & vision care products, books and other entertainment products. 

This Sub-Industry includes tobacco retail, art dealers, manufactured (mobile) home dealers, duty free shops and companies that offer rental of miscellaneous consumer goods.');
INSERT INTO industries (code, title, description) VALUES (25504050, 'Automotive Retail', 'Retailers of automotives.

This Sub-Industry includes automotive dealers, gas stations, and retailers of auto accessories, motorcycles & parts, automotive glass, and automotive equipment & parts.');
INSERT INTO industries (code, title, description) VALUES (25504060, 'Homefurnishing Retail', 'Retailers of furniture and home furnishing products, including residential furniture, housewares, and interior design. 

This Sub-Industry excludes retailers of home and garden improvement products, classified in the Home Improvement Retail Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (30101010, 'Drug Retail', 'Retailers of drugs including operators of pharmacies.');
INSERT INTO industries (code, title, description) VALUES (30101020, 'Food Distributors', 'Distributors of food products to other companies and not directly to the consumer.

This Sub-Industry includes companies distributing or wholesaling food products to other businesses using a proprietary online platform/website.');
INSERT INTO industries (code, title, description) VALUES (30101030, 'Food Retail', 'Retailers of food products.');
INSERT INTO industries (code, title, description) VALUES (30101040, 'Consumer Staples Merchandise Retail (New Name & Definition Update)', 'Retailers offering a wide range of consumer staples merchandise such as food, household, and personal care products.

This Sub-Industry includes hypermarkets, super centers and other consumer staples retailers such as discount retail spaces and on-line marketplaces selling mostly consumer staples goods.');
INSERT INTO industries (code, title, description) VALUES (30201010, 'Brewers', 'Producers of beer and malt liquors, including breweries not classified in the Restaurants Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (30201020, 'Distillers & Vintners', 'Distillers, vintners and producers of alcoholic beverages not classified in the Brewers Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (30201030, 'Soft Drinks & Non-alcoholic Beverages (New Name)', 'Producers of non-alcoholic beverages including mineral waters, sodas and natural bottled water.

This Sub-Industry excludes producers of milk, coffee, tea and fruit juices, classified in the Packaged Foods & Meats Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (30202010, 'Agricultural Products & Services (New Name)', 'Producers of agricultural products.

This Sub-Industry includes crop growers, owners of plantations, producers of animal feed and companies that produce & process food but do not package & market them.

This Sub-Industry excludes companies classified in the Forest Products Sub-Industry and those that package & market the food products classified in the Packaged Foods & Meats Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (30202030, 'Packaged Foods & Meats', 'Producers of packaged foods including dairy products, coffee, tea, fruit juices, meats, poultry, fish, and pet & fish food.');
INSERT INTO industries (code, title, description) VALUES (30203010, 'Tobacco', 'Manufacturers of cigarettes and other tobacco products such as e-cigarettes.

This Sub-Industry excludes companies primarily engaged in producing cannabis related products, classified in Sub-Industries based on end use.');
INSERT INTO industries (code, title, description) VALUES (30301010, 'Household Products', 'Producers of non-durable household products, including detergents, household cleaners & disinfectants and other tissue & household paper products, not classified in the Paper Products Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (30302010, 'Personal Care Products (New Name)', 'Manufacturers of personal and beauty care products, including cosmetics, perfumes, toiletries, diapers, hygiene products, vitamins, dietary supplements and other herbal & holistic medicines.

This Sub-Industry excludes products of curative medical nature classified in the Pharmaceuticals Sub-Industry under the Health Care Sector.');
INSERT INTO industries (code, title, description) VALUES (35101010, 'Health Care Equipment', 'Manufacturers of health care equipment and devices.

This Sub-Industry includes medical instruments, drug delivery systems, cardiovascular & orthopedic devices, and diagnostic equipment that are generally long lasting and/or reusable.');
INSERT INTO industries (code, title, description) VALUES (35101020, 'Health Care Supplies', 'Manufacturers of health care supplies and medical products that tend to be disposable.

This Sub-Industry includes eye care products, hospital supplies, and safety needle & syringe devices.');
INSERT INTO industries (code, title, description) VALUES (35102010, 'Health Care Distributors', 'Distributors and wholesalers of health care products, not classified elsewhere. 

This Sub-Industry includes companies distributing or wholesaling health care products to other businesses using a proprietary online platform/website.');
INSERT INTO industries (code, title, description) VALUES (35102015, 'Health Care Services', 'Providers of patient health care services, not classified elsewhere.

This Sub-Industry includes dialysis centers, lab testing services, and pharmacy management services. It also includes companies providing business support services to health care providers, such as clerical support services, collection agency services, staffing services and outsourced sales & marketing services.');
INSERT INTO industries (code, title, description) VALUES (35102020, 'Health Care Facilities', 'Owners and operators of health care facilities, including hospitals, nursing homes, rehabilitation centers and animal hospitals.

This Sub-Industry includes residential care facilities and assisted living facilities.');
INSERT INTO industries (code, title, description) VALUES (35102030, 'Managed Health Care', 'Owners and operators of Health Maintenance Organizations (HMOs) and other managed plans. These companies derive premium revenues from risk-based health insurance arrangements and include Preferred Provider Organizations (PPOs), Consumer Driven Health Plans (CDHPs), Health Maintenance Organizations (HMOs) and Point-of-Service (POS) plans. It also includes health and dental benefit plans.');
INSERT INTO industries (code, title, description) VALUES (35103010, 'Health Care Technology', 'Companies providing information technology services primarily to health care providers.

This Sub-Industry includes companies providing application, systems and/or data processing software, internet-based tools, and IT consulting services to doctors, hospitals or businesses operating primarily in the Health Care Sector.');
INSERT INTO industries (code, title, description) VALUES (35201010, 'Biotechnology', 'Companies primarily engaged in the research, development, manufacturing and/or marketing of products based on genetic analysis and genetic engineering.

This Sub-Industry includes companies specializing in protein-based therapeutics to treat human diseases.

This Sub-Industry excludes companies manufacturing products using biotechnology but without a health care application.');
INSERT INTO industries (code, title, description) VALUES (35202010, 'Pharmaceuticals', 'Companies engaged in the research, development or production of pharmaceuticals, including active pharmaceutical ingredients (APIs) and veterinary drugs.');
INSERT INTO industries (code, title, description) VALUES (35203010, 'Life Sciences Tools & Services', 'Companies enabling the drug discovery, development and production continuum by providing analytical tools, instruments, consumables & supplies, clinical trial services and contract research services.

This Sub-Industry includes companies primarily servicing the pharmaceutical and biotechnology industries.');
INSERT INTO industries (code, title, description) VALUES (40101010, 'Diversified Banks', 'Large, geographically diverse banks with a national footprint whose revenues are derived primarily from conventional banking operations, have significant business activity in retail banking and small and medium corporate lending, and provide a diverse range of financial services.

This Sub-Industry excludes companies classified in the Regional Banks, Commercial & Residential Mortgage Finance and Investment Banking & Brokerage Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (40101015, 'Regional Banks (Definition Update)', 'Commercial banks, savings banks and thrifts whose business are derived primarily from conventional banking operations such as retail banking, corporate lending and originating various residential and commercial mortgage loans funded mainly through deposits. Regional banks tend to operate in limited geographic regions.

This Sub-Industry excludes companies classified in the Diversified Banks, Commercial & Residential Mortgage Finance and Investment Banking & Brokerage Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (40102010, 'Thrifts & Mortgage Finance (Discontinued)', 'Financial institutions providing mortgage and mortgage related services.  These include financial institutions whose assets are primarily mortgage related, savings & loans, mortgage lending institutions, building societies and companies providing insurance to mortgage banks.');
INSERT INTO industries (code, title, description) VALUES (40201020, 'Diversified Financial Services (New Name)', 'Providers of a diverse range of financial services and/or with some interest in a wide range of financial services including banking, annuity, insurance, investment management and capital markets, but with no dominant business line.

This Sub-Industry excludes companies classified in the Regional Banks and Diversified Banks Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (40201030, 'Multi-Sector Holdings', 'Companies with significantly diversified holdings across three or more GICS Sectors, none of which contributes a majority of profit and/or sales. Stakes held are predominantly of a non-controlling nature.

This Sub-Industry includes diversified financial companies where stakes held are of a controlling nature.

This Sub-Industry excludes other diversified companies classified in the Industrials Conglomerates Sub-Industry. It also excludes mono holding companies that invest in only one specific industry and are classified in the respective Sub-Industries.');
INSERT INTO industries (code, title, description) VALUES (40201040, 'Specialized Finance', 'Providers of specialized financial services, not classified elsewhere. Companies in this Sub-Industry derive a majority of revenue from one specialized line of business.

This Sub-Industry includes commercial financing companies, central banks, leasing institutions, factoring services, and specialty boutiques.

This Sub-Industry excludes companies classified in the Financial Exchanges & Data Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (40201050, 'Commercial & Residential Mortgage Finance (New)', 'Financial companies providing commercial and residential mortgage financing and related mortgage services.

This Sub-Industry includes non-deposit funded mortgage lending institutions, building societies, companies providing real estate financing products, loan servicing, mortgage broker services, and mortgage insurance.');
INSERT INTO industries (code, title, description) VALUES (40201060, 'Transaction & Payment Processing Services (New)', 'Providers of transaction & payment processing services and related payment services, including digital/mobile payment processors, payment service providers & gateways, and digital wallet providers.');
INSERT INTO industries (code, title, description) VALUES (40202010, 'Consumer Finance', 'Providers of consumer finance services, including personal credit, credit cards, lease financing, travel-related money services and pawn shops.

This Sub-Industry includes companies that purchase debt portfolios at a discount from other companies and engage in collection from debtors and earn interest on the debts. It also includes lending facilitation companies operating peer to peer (P2P) Internet communities where users borrow and lend money online. 

This Sub-Industry excludes mortgage lenders classified in the Commercial & Residential Mortgage Finance Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (40203010, 'Asset Management & Custody Banks', 'Financial institutions primarily engaged in investment management and/or related custody and securities fee-based services.

This Sub-Industry includes companies operating mutual funds, closed-end funds and unit investment trusts.

This Sub-Industry excludes banks and other financial institutions primarily involved in commercial lending, investment banking, brokerage and other specialized financial activities.');
INSERT INTO industries (code, title, description) VALUES (40203020, 'Investment Banking & Brokerage', 'Financial institutions primarily engaged in investment banking & brokerage services, including equity & debt underwriting, mergers & acquisitions, securities lending and advisory services.

This Sub-Industry excludes banks and other financial institutions primarily involved in commercial lending, asset management and specialized financial activities.');
INSERT INTO industries (code, title, description) VALUES (40203030, 'Diversified Capital Markets', 'Financial institutions primarily engaged in diversified capital markets activities, including a significant presence in at least two of the following areas: large/major corporate lending, investment banking, brokerage and asset management. 

This Sub-Industry excludes less diversified companies classified in the Asset Management & Custody Banks or Investment Banking & Brokerage Sub-Industries. It also excludes companies classified in the Banks or Insurance Industry Groups and in the Consumer Finance Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (40203040, 'Financial Exchanges & Data', 'Financial exchanges for securities, commodities, derivatives, cryptocurrencies and other financial instruments, and providers of financial decision support tools and products including ratings agencies.

This Sub-Industry excludes providers of financial magazines, journals, and websites classified in the Publishing Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (40204010, 'Mortgage REITs*', 'Companies or Trusts that service, originate, purchase and/or securitize residential and/or commercial mortgage loans.  

This Sub-Industry includes trusts that invest in mortgage-backed securities and other mortgage related assets.');
INSERT INTO industries (code, title, description) VALUES (40301010, 'Insurance Brokers', 'Insurance and reinsurance brokerage firms.');
INSERT INTO industries (code, title, description) VALUES (40301020, 'Life & Health Insurance', 'Companies providing primarily life, disability, indemnity or supplemental health insurance.

This Sub-Industry excludes managed care companies classified in the Managed Health Care Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (40301030, 'Multi-line Insurance', 'Insurance companies with diversified interests in life, health and property & casualty insurance.');
INSERT INTO industries (code, title, description) VALUES (40301040, 'Property & Casualty Insurance', 'Companies providing primarily property and casualty insurance, including financial & title insurance.');
INSERT INTO industries (code, title, description) VALUES (40301050, 'Reinsurance', 'Companies providing primarily reinsurance.');
INSERT INTO industries (code, title, description) VALUES (45102010, 'IT Consulting & Other Services', 'Providers of information technology and systems integration services.

This Sub-Industry includes information technology consulting and information management services.

This Sub-Industry excludes companies that offer management & technology consulting services to government and defense organizations classified in the Research & Consulting Services Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (45102020, 'Data Processing & Outsourced Services (Discontinued)', 'Providers of commercial electronic data processing and/or business process outsourcing services.  Includes companies that provide services for back-office automation.');
INSERT INTO industries (code, title, description) VALUES (45102030, 'Internet Services & Infrastructure', 'Companies providing services and infrastructure for the internet industry including data centers and cloud networking & storage infrastructure.

This Sub-Industry includes companies providing web hosting services, web-based tools for constructing & managing websites, providers of internet security for websites & companies and domain name providers & registry services.

This Sub-Industry excludes companies classified in the Software Industry.');
INSERT INTO industries (code, title, description) VALUES (45103010, 'Application Software', 'Companies engaged in developing and producing software designed for specialized applications for the business or consumer market.

This Sub-Industry includes enterprise & technical software, cloud-based software and companies engaged in bitcoin mining.

This Sub-Industry excludes companies classified in the Interactive Home Entertainment Sub-Industry and companies producing systems or database management software classified in the Systems Software Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (45103020, 'Systems Software', 'Companies engaged in developing and producing software for operating systems & platforms, database management software and firewalls.');
INSERT INTO industries (code, title, description) VALUES (45201020, 'Communications Equipment', 'Manufacturers of communication equipment and products, including LANs (Local Area Networks), WANs (Wide Area Networks), routers, telephone apparatus & modems, switchboards & exchanges and fiber optic cables & coaxial cables used by the telecommunications industry.

This Sub-Industry includes radio & television broadcasting equipment.

This Sub-Industry excludes smartphone manufacturers classified in the Technology Hardware, Storage & Peripherals Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (45202030, 'Technology Hardware, Storage & Peripherals', 'Manufacturers of smartphones, personal computers, laptops, notebooks, servers, electronic computer printers, and related components and peripherals.

This Sub-Industry includes manufacturers of data storage components, motherboards, audio and video cards, monitors and keyboards. It also includes manufacturers of automatic teller machines (ATMs) and hardware used for cryptocurrency mining and validating.

This Sub-Industry excludes semiconductors classified in the Semiconductors Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (45203010, 'Electronic Equipment & Instruments', 'Manufacturers of electronic equipment and instruments, including analytical, electronic test & measurement instruments, scanner/barcode products, lasers, display screens, point-of-sales machines, and security system equipment.');
INSERT INTO industries (code, title, description) VALUES (45203015, 'Electronic Components', 'Manufacturers of electronic components generally used to create end products.

This Sub-Industry includes electronic components, connection devices, electron tubes, electronic capacitors & resistors, electronic coils, printed circuit boards, transformers & other inductors, and signal processing technology/components.');
INSERT INTO industries (code, title, description) VALUES (45203020, 'Electronic Manufacturing Services', 'Producers of electronic equipment mainly for the OEM (Original Equipment Manufacturers) markets. These companies manufacture products that are largely customized as per the specifications outlined by their clients.');
INSERT INTO industries (code, title, description) VALUES (45203030, 'Technology Distributors', 'Distributors of software, technology hardware and equipment, communications equipment, computers & peripherals, semiconductors, and electronic equipment & components.

This Sub-Industry includes companies distributing or wholesaling technology products to other businesses using a proprietary online platform/website.');
INSERT INTO industries (code, title, description) VALUES (45301010, 'Semiconductor Materials & Equipment (New Name)', 'Manufacturers of semiconductor equipment, including manufacturers of the raw material and equipment used in the solar power industry such as raw wafers, gases, liquids and related packaging & material delivery systems.

This Sub-Industry includes companies that provide semiconductor test, assembly, and packaging systems.

This Sub-Industry excludes printed circuit board manufacturers classified in the Electronic Components Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (45301020, 'Semiconductors', 'Manufacturers of semiconductors and related products, including solar modules, solar cells, integrated circuit devices, diodes and light-emitting diodes (LEDs), microprocessors and chips.

This Sub-Industry also includes providers of semiconductor packaging and test services.');
INSERT INTO industries (code, title, description) VALUES (50101010, 'Alternative Carriers', 'Providers of communications and high-density data transmission services primarily through a high bandwidth/fiber-optic cable network.

This Sub-Industry includes satellite companies that mainly offer services to the telecommunication industry.');
INSERT INTO industries (code, title, description) VALUES (50101020, 'Integrated Telecommunication Services', 'Operators of primarily fixed-line telecommunications networks and companies providing both wireless and fixed-line telecommunications services, not classified elsewhere.

This Sub-Industry includes internet service providers offering internet access to end users and companies that construct as well as operate telecommunication towers.

This Sub-Industry excludes companies that mainly construct telecom towers and do not operate them, classified in the Construction & Engineering Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (50102010, 'Wireless Telecommunication Services', 'Providers of primarily cellular or wireless telecommunication services including in-flight internet providers.');
INSERT INTO industries (code, title, description) VALUES (50201010, 'Advertising', 'Companies providing advertising, marketing or public relations services.

This Sub-Industry includes companies offering digital advertising services, marketing consulting services, market research and reward program management services.');
INSERT INTO industries (code, title, description) VALUES (50201020, 'Broadcasting', 'Owners and operators of television or radio broadcasting systems, including programming.

This Sub-Industry includes radio and television broadcasting, radio networks, and radio stations.');
INSERT INTO industries (code, title, description) VALUES (50201030, 'Cable & Satellite', 'Providers of cable or satellite television services.

This Sub-Industry includes cable networks and program distribution.');
INSERT INTO industries (code, title, description) VALUES (50201040, 'Publishing', 'Publishers of newspapers, magazines and books in print or electronic formats.

This Sub-Industry includes publishers of financial journals, magazines, and websites, which do not provide financial data, pricing or ratings information to financial service companies.');
INSERT INTO industries (code, title, description) VALUES (50202010, 'Movies & Entertainment', 'Companies that engage in producing and selling entertainment products and services, including companies engaged in the production, distribution and screening of movies and television shows, producers and distributors of music, entertainment theaters and sports teams.

This Sub-Industry also includes companies offering and/or producing entertainment and music content streamed online.');
INSERT INTO industries (code, title, description) VALUES (50202020, 'Interactive Home Entertainment', 'Producers of interactive gaming products, including mobile gaming applications.

This Sub-Industry includes educational software used primarily in the home, video game developers, and streaming platforms focused on gaming.

This Sub-Industry excludes online gambling companies classified in the Casinos & Gaming Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (50203010, 'Interactive Media & Services', 'Companies engaging in content and information creation or distribution through proprietary platforms, where revenues are derived primarily through pay-per-click advertisements.

This Sub-Industry includes search engines, social media & networking platforms, online classifieds, online review companies and Internet TV companies. It also includes online video and content sharing companies.

This Sub-Industry excludes companies that derive a commission upon a consumer’s purchase or subscription to another company’s product or service, classified in respective Sub-Industries, such as online travel related sites selling a service or product directly to end consumers, which are classified in the Hotels Resorts & Cruise Lines Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (55101010, 'Electric Utilities', 'Companies that produce or distribute electricity, including both nuclear and non-nuclear facilities.

This Sub-Industry includes companies that are vertically integrated across electricity generation and distribution chain, but whose primary business focus is on the distribution of electricity to the end users. It also includes electricity transmission & distribution companies.');
INSERT INTO industries (code, title, description) VALUES (55102010, 'Gas Utilities', 'Companies whose main charter is to distribute and transmit natural & manufactured gas, including propane distributors.

This Sub-Industry excludes companies primarily involved in gas exploration or production classified in the Oil & Gas Exploration & Production Sub-Industry. It also excludes companies engaged in the storage and/or transportation of oil, gas, and/or refined products classified in the Oil & Gas Storage & Transportation Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (55103010, 'Multi-Utilities', 'Utility companies with significantly diversified activities in addition to core electric utility, gas utility and/or water utility operations.');
INSERT INTO industries (code, title, description) VALUES (55104010, 'Water Utilities', 'Companies that purchase and redistribute water to end consumers. 

This Sub-Industry includes large-scale water treatment systems, water supply & irrigation systems, and steam heating.');
INSERT INTO industries (code, title, description) VALUES (55105010, 'Independent Power Producers & Energy Traders', 'Companies that operate as Independent Power Producers (IPPs), Gas & Power Marketing & Trading Specialists and/or Integrated Energy Merchants.

This Sub-Industry excludes producers of electricity using renewable sources, such as solar power, hydropower, and wind power. It also excludes electricity transmission & distribution companies classified in the Electric Utilities Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (55105020, 'Renewable Electricity', 'Companies that engage in the generation and distribution of electricity using renewable sources, including, but not limited to, companies that produce electricity using biomass, geothermal energy, solar energy, hydropower, and wind power.

This Sub-Industry excludes companies manufacturing capital equipment used to generate electricity using renewable sources, such as manufacturers of solar power systems, installers of photovoltaic cells, and companies involved in the provision of technology, components, and services mainly to this market.');
INSERT INTO industries (code, title, description) VALUES (60101010, 'Diversified REITs*', 'A company or Trust with significantly diversified operations across two or more property types.');
INSERT INTO industries (code, title, description) VALUES (60102510, 'Industrial REITs* (New Code)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of industrial properties, such as industrial warehouses and distribution properties.');
INSERT INTO industries (code, title, description) VALUES (60103010, 'Hotel & Resort REITs* (New Code)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of hotel and resort properties.');
INSERT INTO industries (code, title, description) VALUES (60104010, 'Office REITs* (New Code)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of office properties.');
INSERT INTO industries (code, title, description) VALUES (60105010, 'Health Care REITs* (New Code)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of properties serving the health care industry, including hospitals, nursing homes, and assisted living properties.');
INSERT INTO industries (code, title, description) VALUES (60101060, 'Residential REITs (Discontinued)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of residential properties including multifamily homes, apartments, manufactured homes and student housing properties.');
INSERT INTO industries (code, title, description) VALUES (60106010, 'Multi-Family Residential REITs* (New)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of apartments and other multi-family housing, including student housing.');
INSERT INTO industries (code, title, description) VALUES (60106020, 'Single-Family Residential REITs* (New)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of single-family residential housing, including manufactured homes.');
INSERT INTO industries (code, title, description) VALUES (60107010, 'Retail REITs* (New Code)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of shopping malls, outlet malls, neighborhood and community shopping centers.');
INSERT INTO industries (code, title, description) VALUES (60108010, 'Other Specialized REITs* (New Name/ New Code/Definition Update)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of properties not classified elsewhere.

This Sub-Industry includes REITs that manage and own properties such as natural gas and crude oil pipelines, gas stations, fiber optic cables, prisons, automobile parking, and automobile dealerships.');
INSERT INTO industries (code, title, description) VALUES (60108020, 'Self-Storage REITs* (New)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of self storage properties.');
INSERT INTO industries (code, title, description) VALUES (60108030, 'Telecom Tower REITs* (New)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of telecom towers and related structures that support wireless telecommunications.');
INSERT INTO industries (code, title, description) VALUES (60108040, 'Timber REITs* (New)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of timberland and timber-related properties.');
INSERT INTO industries (code, title, description) VALUES (60108050, 'Data Center REITs* (New)', 'Companies or Trusts engaged in the acquisition, development, ownership, leasing, management and operation of data center properties.');
INSERT INTO industries (code, title, description) VALUES (60201010, 'Diversified Real Estate Activities (New Code)', 'Companies engaged in a diverse spectrum of real estate activities including real estate development & sales, real estate management, or real estate services, but with no dominant business line.');
INSERT INTO industries (code, title, description) VALUES (60201020, 'Real Estate Operating Companies (New Code)', 'Companies engaged in operating real estate properties for the purpose of leasing & management, including real estate property managers.');
INSERT INTO industries (code, title, description) VALUES (60201030, 'Real Estate Development (New Code)', 'Companies that develop real estate and sell the properties after development, including developers of active senior communities.

This Sub-Industry excludes companies classified in the Homebuilding Sub-Industry.');
INSERT INTO industries (code, title, description) VALUES (60201040, 'Real Estate Services (New Code)', 'Real estate service providers such as real estate agents, brokers, real estate appraisers and other real estate related services.

This Sub-Industry includes providers of real estate information, analytics, data and tools.

This Sub-Industry excludes online real estate platforms that offer mainly information and earn revenue from pay-per-click advertising classified in the Interactive Media & Services Sub-Industry.');

COMMIT;

-- Summary:
--   Countries: 244
--   Industries: 170
