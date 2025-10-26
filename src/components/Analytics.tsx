import React, { useEffect } from 'react'
import Script from 'next/script'

interface AnalyticsProps {
    gaId?: string
    gtmId?: string
    facebookPixelId?: string
    hotjarId?: string
    mixpanelToken?: string
    amplitudeApiKey?: string
    segmentWriteKey?: string
    debug?: boolean
}

const Analytics: React.FC<AnalyticsProps> = ({
    gaId = process.env.NEXT_PUBLIC_GA_ID,
    gtmId = process.env.NEXT_PUBLIC_GTM_ID,
    facebookPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
    hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID,
    mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
    amplitudeApiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
    segmentWriteKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY,
    debug = process.env.NODE_ENV === 'development',
}) => {
    useEffect(() => {
        // Initialize analytics when component mounts
        if (typeof window !== 'undefined') {
            // Initialize Google Analytics
            if (gaId) {
                (window as any).gtag = (window as any).gtag || function () {
                    ((window as any).gtag.q = (window as any).gtag.q || []).push(arguments)
                }
                    ; (window as any).gtag('js', new Date())
                    ; (window as any).gtag('config', gaId, {
                        page_title: document.title,
                        page_location: window.location.href,
                    })
            }

            // Initialize Facebook Pixel
            if (facebookPixelId) {
                (window as any).fbq = (window as any).fbq || function () {
                    ((window as any).fbq.q = (window as any).fbq.q || []).push(arguments)
                }
                    ; (window as any).fbq('init', facebookPixelId)
                    ; (window as any).fbq('track', 'PageView')
            }

            // Initialize Hotjar
            if (hotjarId) {
                (window as any).hj = (window as any).hj || function () {
                    ((window as any).hj.q = (window as any).hj.q || []).push(arguments)
                }
                    ; (window as any).hj('identify', hotjarId)
            }

            // Initialize Mixpanel
            if (mixpanelToken) {
                (window as any).mixpanel = (window as any).mixpanel || []
                    ; (window as any).mixpanel.init(mixpanelToken, {
                        debug: debug,
                        track_pageview: true,
                        persistence: 'localStorage',
                    })
            }

            // Initialize Amplitude
            if (amplitudeApiKey) {
                (window as any).amplitude = (window as any).amplitude || []
                    ; (window as any).amplitude.getInstance = function () {
                        return (window as any).amplitude
                    }
                    ; (window as any).amplitude.getInstance().init(amplitudeApiKey)
            }

            // Initialize Segment
            if (segmentWriteKey) {
                (window as any).analytics = (window as any).analytics || []
                    ; (window as any).analytics.load(segmentWriteKey)
                    ; (window as any).analytics.page()
            }
        }
    }, [gaId, gtmId, facebookPixelId, hotjarId, mixpanelToken, amplitudeApiKey, segmentWriteKey, debug])

    return (
        <>
            {/* Google Analytics */}
            {gaId && (
                <>
                    <Script
                        strategy="afterInteractive"
                        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                    />
                    <Script
                        id="google-analytics"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `,
                        }}
                    />
                </>
            )}

            {/* Google Tag Manager */}
            {gtmId && (
                <>
                    <Script
                        id="google-tag-manager"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
                        }}
                    />
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                            height="0"
                            width="0"
                            style={{ display: 'none', visibility: 'hidden' }}
                        />
                    </noscript>
                </>
            )}

            {/* Facebook Pixel */}
            {facebookPixelId && (
                <Script
                    id="facebook-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${facebookPixelId}');
              fbq('track', 'PageView');
            `,
                    }}
                />
            )}

            {/* Hotjar */}
            {hotjarId && (
                <Script
                    id="hotjar"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${hotjarId},hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `,
                    }}
                />
            )}

            {/* Mixpanel */}
            {mixpanelToken && (
                <Script
                    id="mixpanel"
                    strategy="afterInteractive"
                    src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"
                />
            )}

            {/* Amplitude */}
            {amplitudeApiKey && (
                <Script
                    id="amplitude"
                    strategy="afterInteractive"
                    src="https://cdn.amplitude.com/libs/amplitude-5.2.2-min.gz.js"
                />
            )}

            {/* Segment */}
            {segmentWriteKey && (
                <Script
                    id="segment"
                    strategy="afterInteractive"
                    src="https://cdn.segment.com/analytics.js/v1/analytics.min.js"
                />
            )}
        </>
    )
}

export default Analytics
