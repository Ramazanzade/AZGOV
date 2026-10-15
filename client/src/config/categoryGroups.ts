// Super-qruplar → DB kök adları (name ilə uyğunlaşdırılır)
// DB-dəki ad tam olaraq bu şəkildədir (rəqəm + boşluq + ad)
export interface SuperGroup {
  id: string;
  label: string;
  icon?: string;
  rootNames: string[]; // DB-dəki root category name-ləri
}

export const SUPER_GROUPS: SuperGroup[] = [
  {
    id: 'demographic',
    label: 'Demoqrafik və sosial',
    icon: 'users',
    rootNames: [
      '01 Əhali',
      '02 Əmək bazarı',
      '03 Təhsil, elm və mədəniyyət',
      '04 Səhiyyə, sosial müdafiə, idman',
      '05 Cinayətkarlıq və hüquqpozmalar',
    ],
  },
  {
    id: 'economy',
    label: 'İqtisadi statistika',
    icon: 'trending-up',
    rootNames: [
      '06 Milli hesablar sistemi və tədiyə balansı',
      '07 Kənd təsərrüfatı, meşə təsərrüfatı və balıqçılıq',
      '08 Sənaye',
      '09 Energetika',
      '10 Tikinti',
      '11 Ticarət',
      '12 Nəqliyyat',
      '13 Telekommunikasiya və poçt',
      '14 Maliyyə və bank',
      '15 Qiymət',
      '16 Ödənişli xidmət',
      '17 İaşə',
      '18 Turizm',
      '19 Təsərrüfat subyektlərinin xarakteristikası',
      '25 Sahibkarlıq',
      '26 Ərzaq balansları',
    ],
  },
  {
    id: 'environment',
    label: 'Ətraf mühit və digər',
    icon: 'leaf',
    rootNames: [
      '20 Ətraf mühitin mühafizəsi',
      '21 Regionlar',
      '22 Ev təsərrüfatları büdcəsi',
      '23 Gender',
      '24 Rəqəmsal inkişaf',
    ],
  },
  {
    id: 'geo',
    label: 'Coğrafi məlumatlar',
    icon: 'map',
    rootNames: [
      // Hələlik boş — coğrafi datasetlər ayrı sistemdə ola bilər
    ],
  },
];