'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fNumber, fCurrency } from 'src/utils/format-number';

import 'src/components/invoice-print/invoice-print-print.css';

// ----------------------------------------------------------------------

const CURRENCY_OPTS = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

/**
 * Standard thermal receipt layout: header (center), meta (mixed), items table, totals (dotted filler), footer (center).
 * No logo in default layout; monospace-friendly. Used for print and preview.
 */
export function InvoicePrintLayout({ payload, widthPreset = '80mm', className, ...rest }) {
  if (!payload) return null;

  const { header, meta, lines, totals, footer, isReprint } = payload;
  const is58 = widthPreset === '58mm';

  return (
    <Box
      className={className}
      sx={{
        maxWidth: is58 ? '58mm' : '80mm',
        width: '100%',
        margin: 0,
        padding: is58 ? 1 : 1.5,
        fontFamily: 'monospace',
        fontSize: is58 ? 11 : 12,
        color: 'text.primary',
        bgcolor: 'background.paper',
        ...rest.sx,
      }}
      {...rest}
    >
      {isReprint && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            fontWeight: 700,
            mb: 0.5,
            borderBottom: 1,
            borderColor: 'divider',
            pb: 0.5,
          }}
        >
          DUPLICATE COPY
        </Typography>
      )}

      {/* 2.1 Header block - all center */}
      <Box sx={{ textAlign: 'center', mb: 1.5 }}>
        <Typography component="div" sx={{ fontWeight: 700, fontSize: '1.1em', mb: 0.25 }}>
          {header?.restaurantName || '—'}
        </Typography>
        {header?.branchName && (
          <Typography component="div" variant="body2">
            {header.branchName}
          </Typography>
        )}
        {header?.address && (
          <Typography component="div" variant="caption" sx={{ wordBreak: 'break-word' }}>
            {header.address}
          </Typography>
        )}
        {header?.ntn && (
          <Typography component="div" variant="caption">
            NTN # {header.ntn}
          </Typography>
        )}
        {header?.contact && (
          <Typography component="div" variant="caption">
            Contact # {header.contact}
          </Typography>
        )}
      </Box>

      {/* 2.2 Order metadata - mixed alignment */}
      <Box sx={{ mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.5,
          }}
        >
          <Typography component="span" variant="body2">
            Invoice # {meta?.invoiceNumber ?? '—'}
          </Typography>
          <Typography component="span" variant="body2" sx={{ fontWeight: 700, flex: 1, textAlign: 'center' }}>
            {meta?.paymentStatus ?? 'Unpaid'}
          </Typography>
          <Typography component="span" variant="body2" sx={{ textAlign: 'right' }}>
            Punched By {meta?.cashierName || '—'}
          </Typography>
        </Box>
        <Typography component="div" variant="body2" sx={{ mt: 0.25 }}>
          Date: {meta?.dateTime ?? '—'}
        </Typography>
        <Typography component="div" variant="body2" sx={{ fontWeight: 700, textAlign: 'center', my: 0.25 }}>
          Order # {meta?.orderNumber ?? '—'}
        </Typography>
        <Typography component="div" variant="body2">
          Order Type: {meta?.orderType ?? '—'}
        </Typography>
        {meta?.tableName && (
          <Typography component="div" variant="body2">
            Table: {meta.tableName}
          </Typography>
        )}
      </Box>

      {/* 2.3 Separator */}
      <Box sx={{ borderTop: 1, borderColor: 'divider', my: 1 }} />

      {/* 2.4 Item list */}
      <Box sx={{ mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
            pb: 0.25,
            mb: 0.5,
          }}
        >
          <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
            Product
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <Typography component="span" variant="body2" sx={{ fontWeight: 600, minWidth: 28, textAlign: 'right' }}>
              Qty
            </Typography>
            <Typography component="span" variant="body2" sx={{ fontWeight: 600, minWidth: 44, textAlign: 'right' }}>
              Rate
            </Typography>
            <Typography component="span" variant="body2" sx={{ fontWeight: 600, minWidth: 44, textAlign: 'right' }}>
              Total
            </Typography>
          </Box>
        </Box>
        {(lines || []).map((line, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
              py: 0.25,
              breakInside: 'avoid',
            }}
          >
            <Typography
              component="div"
              variant="body2"
              sx={{
                flex: 1,
                minWidth: 0,
                wordBreak: 'break-word',
                pr: 1,
              }}
            >
              {line.productName || '—'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              <Typography component="span" variant="body2" sx={{ minWidth: 28, textAlign: 'right' }}>
                {line.qty}
              </Typography>
              <Typography component="span" variant="body2" sx={{ minWidth: 44, textAlign: 'right' }}>
                {fNumber(line.rate)}
              </Typography>
              <Typography component="span" variant="body2" sx={{ minWidth: 44, textAlign: 'right' }}>
                {fNumber(line.total)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* 2.3 Separator */}
      <Box sx={{ borderTop: 1, borderColor: 'divider', my: 1 }} />

      {/* 2.5 Totals - dotted filler for subtotal, bold grand total */}
      <Box sx={{ mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            py: 0.25,
          }}
        >
          <Typography component="span" variant="body2">
            Subtotal:
          </Typography>
          <Box sx={{ flex: 1, borderBottom: '1px dotted', borderColor: 'divider', mx: 0.5, alignSelf: 'baseline' }} />
          <Typography component="span" variant="body2">
            {fCurrency(totals?.subtotal ?? 0, CURRENCY_OPTS)}
          </Typography>
        </Box>
        {(totals?.taxAmount ?? 0) > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              py: 0.25,
            }}
          >
            <Typography component="span" variant="body2">
              Tax {totals?.taxPercentage != null ? `${totals.taxPercentage}%` : ''}:
            </Typography>
            <Box sx={{ flex: 1, borderBottom: '1px dotted', borderColor: 'divider', mx: 0.5, alignSelf: 'baseline' }} />
            <Typography component="span" variant="body2">
              {fCurrency(totals.taxAmount, CURRENCY_OPTS)}
            </Typography>
          </Box>
        )}
        {(totals?.discountAmount ?? 0) > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              py: 0.25,
            }}
          >
            <Typography component="span" variant="body2">
              Discount {totals?.discountPercentage != null ? `${totals.discountPercentage}%` : ''}:
            </Typography>
            <Box sx={{ flex: 1, borderBottom: '1px dotted', borderColor: 'divider', mx: 0.5, alignSelf: 'baseline' }} />
            <Typography component="span" variant="body2">
              -{fCurrency(totals.discountAmount, CURRENCY_OPTS)}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            py: 0.5,
            mt: 0.5,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
            Grand Total:
          </Typography>
          <Typography component="span" variant="body2" sx={{ fontWeight: 700 }}>
            {fCurrency(totals?.grandTotal ?? 0, CURRENCY_OPTS)}
          </Typography>
        </Box>
      </Box>

      {/* 2.6 Footer - center, smaller */}
      <Box sx={{ textAlign: 'center', pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ fontSize: '0.85em', color: 'text.secondary' }}>
          Powered by: {footer?.poweredBy ?? 'POS'}
        </Typography>
      </Box>
    </Box>
  );
}
