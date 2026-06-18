import { Html, Head, Body, Container, Section, Text, Button, Hr } from 'react-email'

interface TabEmailProps {
  kind: 'opened' | 'item-added' | 'finalized' | 'reminder' | 'cancelled'
  tab: { recipientName: string; notes?: string }
  items: { description: string; amountCents: number }[]
  total: number
  balance: number
  latest?: string
  payUrl: string
}

export function TabEmail({ kind, tab, items, total, balance, latest, payUrl }: TabEmailProps) {
  const format = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const subjects: Record<typeof kind, string> = {
    opened: "a running tab, from your conscience",
    'item-added': `uohmi update — running total: ${format(total)}`,
    finalized: `the final tally: ${format(total)}`,
    reminder: `friendly reminder — you still owe ${format(total)}`,
    cancelled: "invoice cancelled",
  }
  const preheaders: Record<typeof kind, string> = {
    opened: "I'll add expenses as they come. Pay now or whenever.",
    'item-added': `Just added: ${latest}. Running total below.`,
    finalized: "That's everything. Pay when you can. I'm watching.",
    reminder: "Just checking in. The debt remains.",
    cancelled: "The invoice has been cancelled. You're off the hook.",
  }

  return (
    <Html lang="en">
      <Head />
      <Body style={{ fontFamily: 'Georgia, Times New Roman, serif', backgroundColor: '#faf8f5', color: '#2c2825' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5ddd6' }}>
            <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#c4847a', marginBottom: '16px', fontFamily: 'Georgia, serif' }}>
              uohmi
            </Text>
            <Text style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
              {preheaders[kind]}
            </Text>

            {kind === 'cancelled' ? (
              <>
                <Text style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
                  Hi {tab.recipientName}, the invoice sent to you has been cancelled. You don't owe anything.
                </Text>
                {tab.notes && (
                  <Section style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fdf0ee', borderRadius: '8px' }}>
                    <Text style={{ fontSize: '14px', color: '#a8685e', fontStyle: 'italic' }}>"{tab.notes}"</Text>
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
                    You said you'd pay me back. Here we are.
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
                  <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#c4847a' }}>{format(total)}</Text>
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
                  <Section style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fdf0ee', borderRadius: '8px' }}>
                    <Text style={{ fontSize: '14px', color: '#a8685e', fontStyle: 'italic' }}>"{tab.notes}"</Text>
                  </Section>
                )}

                <Section style={{ marginTop: '32px', textAlign: 'center' }}>
                  <Button
                    href={payUrl}
                    style={{
                      backgroundColor: '#c4847a',
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
                    That's everything. No more surprises.
                  </Text>
                )}
              </>
            )}
          </Section>

          <Text style={{ marginTop: '24px', fontSize: '12px', color: '#c4b5ac', textAlign: 'center' }}>
            Sent via uohmi — for when they said they'd pay you back.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}