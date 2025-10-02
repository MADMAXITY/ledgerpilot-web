import { Container, Typography, Box } from '@mui/material'
import UploadDropzone from '@/components/UploadDropzone'

export default function DashboardPage() {
  return (
    <Container maxWidth="md">
      <Box>
        <UploadDropzone />
      </Box>
    </Container>
  )
}
