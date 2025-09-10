
export const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3OWI0MDUyYi0xNDUwLTRjNmUtYmIyYy0xNzRhZWI5YzFjODUiLCJlbWFpbCI6ImlzaGFhbmJhbnNhbDE0MTJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjQ4YzFkZjQ5ZGQ4OWE0ZGNiYmM0Iiwic2NvcGVkS2V5U2VjcmV0IjoiMzhjNTI1Y2I0ZWI5ZDgwYWQ0OGEyYmFiYjQ4N2FjZGI0YjhiMDJlN2RhYjVkZjJjNDlmOTAwMTk3ZTA0NTVjMiIsImV4cCI6MTc4ODkwMzM4NH0.dJCkkOJZ0WSD_xIv0rEbuFemlRrfLNEadbh0w26S_Z8";
// Test Pinata connection
export async function testPinataConnection() {
  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    })
    
    const result = await response.json()
    console.log('Pinata connection test:', result)
    return result
  } catch (error) {
    console.error('Pinata connection test failed:', error)
    throw error
  }
}

export async function uploadToPinata(file) {
  try {
    console.log('Starting upload to Pinata...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    // Test connection first
    await testPinataConnection()

    const formData = new FormData()
    formData.append('file', file)

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size.toString()
      }
    })
    formData.append('pinataMetadata', metadata)

    const options = JSON.stringify({
      cidVersion: 1,
    })
    formData.append('pinataOptions', options)

    console.log('Uploading file to Pinata...')

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    })

    console.log('Pinata response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Pinata upload error:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const result = await response.json()
    console.log('Pinata upload successful:', result)
    
    if (!result.IpfsHash) {
      throw new Error('No IPFS hash returned from Pinata')
    }

    return result.IpfsHash
  } catch (error) {
    console.error('Error uploading to Pinata:', error)
    throw new Error(`Failed to upload to IPFS: ${error.message}`)
  }
}

export async function uploadJSONToPinata(jsonData, name) {
  try {
    console.log('Uploading JSON to Pinata:', name)

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: JSON.stringify({
        pinataContent: jsonData,
        pinataMetadata: {
          name: name,
          keyvalues: {
            uploadedAt: new Date().toISOString(),
            type: 'json'
          }
        },
        pinataOptions: {
          cidVersion: 1
        }
      })
    })

    console.log('JSON upload response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('JSON upload error:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const result = await response.json()
    console.log('JSON upload successful:', result)
    return result.IpfsHash
  } catch (error) {
    console.error('Error uploading JSON to Pinata:', error)
    throw new Error(`Failed to upload JSON to IPFS: ${error.message}`)
  }
}

// Utility function to get file from IPFS
export function getIPFSUrl(cid) {
  return `https://gateway.pinata.cloud/ipfs/${cid}`
}

// Utility function to validate file before upload
export function validateFile(file, maxSizeMB = 100, allowedTypes = []) {
  if (!file) {
    throw new Error('No file provided')
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`)
  }

  return true
}
