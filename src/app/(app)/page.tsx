import { Container, Typography, Box } from '@mui/material'
import UploadDropzone from '@/components/UploadDropzone'

export default function DashboardPage() {
  return (
    <Container maxWidth="md">
      <Typography variant="h5" sx={{ mb: 2 }}>
        Upload
      </Typography>
      <Box>
        <UploadDropzone />
      </Box>
    </Container>
  )
}
