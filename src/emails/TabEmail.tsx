import { Html, Head, Body, Container, Section, Text, Button, Hr } from 'react-email'
import { getBrand } from '@/lib/branding'

interface TabEmailProps {
  kind: 'opened' | 'item-added' | 'finalized' | 'reminder' | 'cancelled' | 'link-updated' | 'merged'
  tab: { recipientName: string; notes?: string; mode?: string | null }
  items: { description: string; amountCents: number }[]
  total: number
  balance: number
  latest?: string
  payUrl: string
}

export function TabEmail({ kind, tab, items, total, balance, latest, payUrl }: TabEmailProps) {
  const format = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const brand = getBrand(tab.mode)
  const preheaders: Record<typeof kind, string> = {
    opened: brand.emailPreheaders.opened,
    'item-added': brand.emailPreheaders['item-added'](latest ?? ''),
    finalized: brand.emailPreheaders.finalized,
    reminder: brand.emailPreheaders.reminder,
    cancelled: brand.emailPreheaders.cancelled,
    'link-updated': brand.emailPreheaders['link-updated'],
    merged: brand.emailPreheaders.merged,
  }

  return (
    <Html lang="en">
      <Head />
      <Body style={{ fontFamily: 'Georgia, Times New Roman, serif', backgroundColor: '#faf8f5', color: '#2c2825' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5ddd6' }}>
            <Text style={{ fontSize: '24px', fontWeight: 'bold', color: brand.accent.base, marginBottom: '16px', fontFamily: 'Georgia, serif' }}>
              {brand.name}
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              {preheaders[kind]}
            </Text>

            {kind === 'cancelled' ? (
              <>
                <Text style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
                  Hi {tab.recipientName}, the invoice sent to you has been cancelled. You don&apos;t owe anything.
                </Text>
                {tab.notes && (
                  <Section style={{ marginBottom: '24px', padding: '16px', backgroundColor: brand.accent.bg, borderRadius: '8px' }}>
                    <Text style={{ fontSize: '14px', color: brand.accent.dark, fontStyle: 'italic' }}>&ldquo;{tab.notes}&rdquo;</Text>
                  </Section>
                )}
                <Text style={{ fontSize: '14px', color: '#7c6e67', fontStyle: 'italic' }}>
                  No further action is needed on your part.
                </Text>
              </>
            ) : (
              <>
                {kind === 'opened' && (
                  <Text style={{ fontSize: '14px', color: '#7c6e67', marginBottom: '24px', fontStyle: 'italic' }}>
                    {brand.emailOpener}
                  </Text>
                )}

                <Section style={{ marginBottom: '24px' }}>
                  {items.map((item, i) => (
                    <Section key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < items.length - 1 ? '1px solid #f3f0ec' : 'none' }}>
                      <Text style={{ fontSize: '15px' }}>{item.description}</Text>
                      <Text style={{ fontSize: '15px', fontWeight: '500' }}>{format(item.amountCents)}</Text>
                    </Section>
                  ))}
                </Section>

                <Hr style={{ borderColor: '#e5ddd6', margin: '24px 0' }} />

                <Section style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <Text style={{ fontSize: '16px', fontWeight: '500' }}>Total</Text>
                  <Text style={{ fontSize: '18px', fontWeight: 'bold', color: brand.accent.base }}>{format(total)}</Text>
                </Section>

                {balance < total && (
                  <Section style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <Text style={{ fontSize: '15px', color: '#7c6e67' }}>Already paid</Text>
                    <Text style={{ fontSize: '15px', color: '#2a7a4a' }}>{format(total - balance)}</Text>
                  </Section>
                )}

                <Section style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>Balance due</Text>
                  <Text style={{ fontSize: '20px', fontWeight: 'bold', color: balance > 0 ? '#a04030' : '#2a7a4a' }}>{format(Math.max(0, balance))}</Text>
                </Section>

                {tab.notes && (
                  <Section style={{ marginTop: '24px', padding: '16px', backgroundColor: brand.accent.bg, borderRadius: '8px' }}>
                    <Text style={{ fontSize: '14px', color: brand.accent.dark, fontStyle: 'italic' }}>&ldquo;{tab.notes}&rdquo;</Text>
                  </Section>
                )}

                <Section style={{ marginTop: '32px', textAlign: 'center' }}>
                  <Button
                    href={payUrl}
                    style={{
                      backgroundColor: brand.accent.base,
                      color: '#ffffff',
                      padding: '16px 32px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    View & settle up
                  </Button>
                </Section>

                {kind === 'opened' && (
                  <Text style={{ marginTop: '24px', fontSize: '13px', color: '#c4b5ac', textAlign: 'center' }}>
                    Still adding expenses — pay now or wait for the final total.
                  </Text>
                )}

                {kind === 'finalized' && (
                  <Text style={{ marginTop: '24px', fontSize: '13px', color: '#c4b5ac', textAlign: 'center' }}>
                    {brand.emailPreheaders.finalized}
                  </Text>
                )}

                {kind === 'merged' && (
                  <Text style={{ marginTop: '24px', fontSize: '13px', color: '#c4b5ac', textAlign: 'center' }}>
                    Your previous invoice link no longer works — use the button above.
                  </Text>
                )}
              </>
            )}
          </Section>

          <Text style={{ marginTop: '24px', fontSize: '12px', color: '#c4b5ac', textAlign: 'center' }}>
            {brand.emailFooterTagline}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}