# Help me setup new video source "Hexa". We already have video.js based player setup for  "isApiSource": true sources. Make sure you integrate it with that and also make sure it doesn't affect the working of other sources. For m3u8 video links, they are playing fine when i play them in vlc player so make sure you use proper cors to handle that.

Video-source.json is being fetched from https://source-api.chintanr21.workers.dev
so you wont be able to see it. Here is the content for your reference:
```
{
  "videoSources": [
    {
      "key": "hexa",
      "name": "Hexa",
      "movieUrlPattern": "https://hexa-worker.chintanr21.workers.dev/movie/{id}",
      "tvUrlPattern": "https://hexa-worker.chintanr21.workers.dev/tv/{id}/{season}/{episode}",
      "isApiSource": true,
      "requiresAuth": true
    }
}
```

We already have two more sources configured individually in the app which use "isApiSource": true

### Source response pattern:

## Movie: https://hexa-worker.chintanr21.workers.dev/movie/1236153

Response:
```
{
"provider": "hexa",
"type": "movie",
"tmdb_id": 1236153,
"season": null,
"episode": null,
"streams": [
{
"url": "https://p.10020.workers.dev/frostcomet5.pro/file2/99qJJBfR1fvEXEnHa6pmKgP4ZqVxTCUB9sCfS6Ih40obSFcw4mt7Kri~Bz5ZQLU6ewDdd8Ct+YsOaAMFQVoABM+z7z9qhAqOtLH7HUTRUN4U9xiRxqIR2k63PnvE8~Mb8Tx3F3ROkj1smVaOj9SNpgeOJpdmiIMlTeK2Gxflnl4=/cGxheWxpc3QubTN1OA==.m3u8",
"quality": "alpha",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
},
{
"url": "https://p.10020.workers.dev/s/afc7d47f/ma9yIsUHLd1oEUKmveBRD2n71BlnonFYdmAX3C0mR01U13uMl9yMQ4BSRKto7YDR7K6V3-VRbTgsP9kHr5N_E2wKbcIMAHmkQfhxQZ250z9sSottITHo1oWqcdxbmtFobzl6GAJ6CbTKl2FDLtgyfp3ZdSUSlO7xDHhb9_wUFj0PdrsRy8DHB2_qnXx_mDI8YrphTuInCiQuucXEPuROMqa5OsoLDvt4P5-kUX3eEhpL5LAf8hY8xqj-H4avDGVh5NSullPLVTC4kJSgrGtLLzJXw3LqBZ4Runde4tT6rdx8FZ5RuTCzdPA8Qi7v3j12PU4Mi1KuZwu0hwW6J4BLPfA700wtkUgTt9Qk1xdyVPjPNP1t8lsx1kBmXEGK5BsD-6W2nFAsen_RHf3-rf0oLpoVFZ2WzBzdTFgK7iQEKqJMGzfkWsUwVrswr6kq8ciVTDi1e8xccDU0RA92Ebi3iv6XN9SegOFKOnl-HELr5KWpy-ldQRNm1KiCgFC9ep04yt1FpGmrLLZ9ZS0hDuucZTNaA0jfwSP_J2DMQ7f_ZUbGdvLVKGviSG8B0Q8Zh6yPH7JcKe7qk66qElDXUu3xSrqmwzi7yMJ9zKb7gQHfab6lTfIIyR-_D1WMXGDOyXiQyn8rgce1PJ447WCtZaNS1w.m3u8",
"quality": "bravo",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
},
{
"url": "https://p.10020.workers.dev/s/afc7d47f/ma9yIsUHLd1oEUKmveBRD7YAa6TtBq8pQ3HlTrfwAmaCVWKODqhjdHV_akF-4XHWMtXDvPEP9YYhFwVOIP6jPASDrR5H5ZpqfA7H53wU7xhTQ8mBNNQlYDVWr0lT3wc8ouZ-R1PXP89VvPEzuo1y2l12VgRhr1kJULfrKhUAUqxLevjPhLqXrqCDJnpNfPwA0d21uPQaqUulnqbsONP7TzWohsINEXSV3MfQbwNCnQByo9XlpZmOKPlIzByIk4fTvtY3xMg2sZS5IpnIEa-t6ga3NhaMnpU1241UU7gaLiw.m3u8",
"quality": "delta",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
},
{
"url": "https://p.10020.workers.dev/p/afc7d47f/ma9yIsUHLd1oEUKmveBRDymDQaZ4VfB4ZWMO7Rt8hsovyshny--YvZWThZ21jmjvwULQramCynm6gWwQYL48yupikacNpLY2tC7OrWcz7hzjakIzUOHe5BlvGlarmECYUeSm0k4eZRPLvPwJuR_cn48Tc0AkssbtyC-YGCIr-PUpJrk2yUizTh_gA3Lw1rx3wpXW5DLrSHNq5drkhN4vqPrENsstObwXJyJyfO8_VCL5ufQ1uFiUVAGWV1E1n0QRgoc9xs6JfVWvqUwqLqQyFBNTTSa4xbNacsTbscs5tTQKizq__12ImtrmnkJSF7BiJOsaDxAQzUZEJZUBd6AuHKVIPmX7Iq1vuLHCnEHSom-dS2gM32dhHWFfJ5X5fo4yeTRLkMMea9eXGsBJTUzu-5kc7ho6O2LCccKjYU_4JTTRKs5dJEkMtjULDht1KpzAi8x0WtcsUL3BkuS8OiqeJLa2fRBypdegRyUkdp0hwrdHBnqo3O95S7wBI7_Ua0Xg2kmZ74KpV2S52fM8xsRNYwGMs83JB_vUTLj6XJZTonuwMlZDSlpA9EkrRPBByLrxccNIMBF-erXIJttR865QLd8ibiISViOA-qpOl98PR9jsfIfHbjo1e5_EvO8gEH4h.m3u8",
"quality": "echo",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
},
{
"url": "https://p.10020.workers.dev/s/afc7d47f/ma9yIsUHLd1oEUKmveBRD7G3Bq906aVTDGgvpXZk7gsbkt2yyrNk7U0gyV5vtyKxr0wksVkZtcrSUVAqlhYObi75I8iQKPr_dqMyTgZOtWSXiPrQ5QTYQZBhm2rg0RdS6cl0ikpqeseL7surBwKYwz6GakRR9J7tiej5yDqkFzRIrcOPrr-wQvI0BXDZvXLBoCIH0heJrBI_2Pde7hipI3AzIVuFe07RThCDHBFo7F5v_OefQjRJCviukrMDWrfPK9e7N8FfNYTBDXgMZjdGNY-c8odMs4caQhiCOQZbUD1-DmbwJdJegcUfpengw9GYZL4X5JLtS1DJbpbMZeP7_jRNOKtcVDkPzlXo3b0mz0Y.m3u8",
"quality": "foxtrot",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
},
{
"url": "https://p.10020.workers.dev/s/afc7d47f/ma9yIsUHLd1oEUKmveBRD1zCU3zTm9A4Y40zUtHCG30KsHLrZsUSf_MUaPkVHe1xON4jrIBXHSOw-707xlxCpihMNAowRQQ2DibhSBZ9wAsw_WquifsoOOuAy8rdYhqze1JJDOtqDqZmNbT5GSEnJNH0-XjQX1SLK7Q_-aDuuiybM8TPvbBXIyAzioRMmiIIbyU-dagOt_Lr2TfsIsEZiTPf_-0rcxeFtssr7cg0UOE9nwkq2Eil8aFVzlP5L7YvCK4vyK-E76IINGw3sxvLDZPiS6JO9-9hH8UlFAz-PbaOcMHe5qUYMC7CR2pk1md0WBOA2Aks0hc61XpYQgkHog.m3u8",
"quality": "hotel",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
}
],
"success": true,
"error": null
}

```

## TV-Show: https://hexa-worker.chintanr21.workers.dev/tv/1396/1/1

Response:
```
{
"provider": "hexa",
"type": "tv",
"tmdb_id": 1396,
"season": 1,
"episode": 1,
"streams": [
{
"url": "https://p.10020.workers.dev/nightbreeze17.site/file2/URvacNgbRRt9YqnSe2X1OhO1bexc2tfhNmwmKw4E4CCThu0kDGB9AV+DL2I84pcBiL79x0ntvPxkTnz6y16gd+ii9frl98+3CtLGWmmuifEDsVqW9JtyEwwCp5yw14oGPUJvQ40XBnQ1C2RHg8fJ7KmlfNclLalMfWHzormJjXg=/cGxheWxpc3QubTN1OA==.m3u8",
"quality": "alpha",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
},
{
"url": "https://p.10020.workers.dev/s/afc7d47f/ma9yIsUHLd1oEUKmveBRD6apy4IVvgvlxGo9vYloTa5jxysrkFAPUlkXr-Y3z9It2wlex4cuWkFv8yZyumTSmAK_ZuauURp4a1Cqm4CuehSfB_5o_0F5n71a-fCoWH5c5-kVVIyP1bP9UonPbVV-9gmewexoQr2BkWbU2JcDDUECbp1mKHMTRx5U1480Pd8N0MbKKuWF7wBABoNIkKijpo8MKiYiAOXaHk5e0KXUT4xGBQhR-SjdXJf5A12W3tH_rl5O4Xv35Jrra8bL2FU_bi2Vp0445YIkvU1F-5i9Re3zsoH5azFqO9tLqS3Bkb1H7JaMkuDh3uSSgfae3iogMmI-pQwYYPZtp2SCtcqoJ2fbwnHVjO5btdb_DMQF9H1mIsru4eDmMnaiEVZ444v8Fg5MFjKpbyG2w3lTa3eqfdoB02WaAQm4qSqqksPXDapmVUzF1GplGjmfzCrSz14jRFMSsy9nScsmzJWwyLVPGF21KjxPoQaDegSnPvOBm42msjwpw2x5Zv2QnyNJqqkaC4mz9Gms2DARI-gkb0sfLOuYRcEX7qoITRRKsnPC0b-yArmGcOF_npAahZY8nPBXc_LXyCPGS5_SAq4IP33rgbrYpvDH0RJHODfgyx0_AhOby5KpZ5bo4frK1j1cvsc3A52TtGg6qDj0S7KJiXlBwOpATlEC0UiDd-3rt-BwjTngMmxpCMXPeavtzs9Znbk6nw.m3u8",
"quality": "bravo",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
},
{
"url": "https://p.10020.workers.dev/s/afc7d47f/ma9yIsUHLd1oEUKmveBRD1tx-SeXQgOM0Zj6qmFNTgG__hedVM3YZ29YH3_MrjZgubt7fN-kU6M_kcgZm-4yrvldW7zCE1lstx0WifTHEnsDKC2VoapPlwQeAcQXXHTkOLgoddU7T1gNxQiH79CLbQZSoWAelW1xwv5bgkzAcscD3zhpO9x_UVM_BNSK18XUWUZaHC1vLYKVe0Lvjd93Sb3_U45dvoBHyVa3YDj66S44apz9pGwBcLFTz4-BPqsw63qrpo37Wi-PTO6FD9i8E27RoH8VqALoiIRAqRj3-9nVC4RUbYUvmt_c9Lg814f4SpSr3Ig19ffOqS-z7e4S57xmHx-tbHlcTaFxU_uHBrHJaCxFvbID6izXx3Uvt8RQFXNy9osTBxqXIX-qrCkFaK7OgE6C86FXkHhVJuFRtK8.m3u8",
"quality": "charlie",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
},
{
"url": "https://p.10020.workers.dev/s/afc7d47f/ma9yIsUHLd1oEUKmveBRD7YAa6TtBq8pQ3HlTrfwAmaEfB62QmW4xcBTEprbgXfxqfKJzJl23LzJiYbvK4Ie-EQquWJpXWNijoxXS1pJILwGkuzCOIt1mjVoTm3Wzgv2PJL5S5qz0ff4fWclBkgSWrRcARaofmZeg3cZO0mHaAfxAVpahj3OGEbK9wTm_xnXqdqWPZSiKAmQzY4FnxUJyzwkvlyZ0sbYDydR8lXFWOj6tkygbwnsIYj-hwC69inba8-smZ9JlEWlpTYb4ZBoTzFUnbn8W0PK4kt--eN6GbI.m3u8",
"quality": "delta",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
},
{
"url": "https://p.10020.workers.dev/p/afc7d47f/ma9yIsUHLd1oEUKmveBRD-6ULsKnIfXoqAtiilmfexrR-Wn59JmF7sjQGYGOTEvLU5aoZq8uw74J9MqXYv1LmgD2v8yqSIXuYl-VzdCP-P2KTmo02BPYGeFHLjGoau-DhuQvLTIfVLnPn_kwPZV9Nm1eRD0kLQXoxd0GZ8f0Jeaz2yQkc6A7ZU6FBDNqPijfb8przVLv4TbvsT4YZvasow5anyhjfKgSmsf3ZZV-Kzo6qLFkSZyc-lbwq1yhfSMQ44hls1pbPw5_43ENS2_rJFYn2gBHacm0LFQeKlv90CoJXsbDxPh97aeIyoxyFT1Ch2ptaceKKM46C0ACFoDSidZG0u_DDUzv3L6ho5DGWoEc5ivRuZR3b9De14-1_nYHeRKRdRmFtsL7R8mZ-aBVxRAjLGdc5KMR-ymJnOY3VmU2aM45QQssXX8604_pgbQMkthpkzAPPhjqIhhLfOyYYY8ZdL8amR8uwd_B5ihgYj7VwFcnK5dFJFn9zNu6opbT8cjBSvuYMb0N5uETMIY6-QUrC0K3gvKH9TDL5UFa4yt26Otuf3JtgsgFB4uzcMIItSgwD_TNuIZduWNlqbIxxOA-0Ind771Ehkr4jv5dqxT7Wbuv9d0KMMH4-WUCsOPW.m3u8",
"quality": "echo",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
},
{
"url": "https://p.10020.workers.dev/s/afc7d47f/ma9yIsUHLd1oEUKmveBRD7G3Bq906aVTDGgvpXZk7gsqIOdRvVPFl519O6HeCFH074nHyxQfDSKkIYFVbdixnDp9qdH-I0BdQVhUFKmIW1D3zW6yIZNSn1ioIwMpoG3uWQbgci--1l1xfOoKw4tVl-1aIb_LUpT6VUFcM9pmtNC6wWqCPlTMUhtaDx8jU-2twiB2onQOHWErpZPbYF4tMWwYW8CQkPmFg3pU8_PO07ybfWVZSF5QebIyiCZtizgpXNNCJOyNKpd8_p9Ji_-I_M4zCBKDatcpgQSEFEIt4Is3WJCA9W86Ozh_AV61nN3WhGCE7lVIE_plSDub1I7N9w.m3u8",
"quality": "foxtrot",
"title": "Hexa Stream",
"stream_type": "hls",
"referer": "",
"headers": {
"Origin": ""
},
"language": "en"
}
],
"success": true,
"error": null
}

```