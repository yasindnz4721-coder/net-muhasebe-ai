UPDATE satis_faturalari SET durum = 'Onaylandı' WHERE durum IN ('Beklemede', 'Ödendi');
UPDATE alis_faturalari SET durum = 'Onaylandı' WHERE durum IN ('Beklemede', 'Ödendi');
