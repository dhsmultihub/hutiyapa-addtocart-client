import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('Cleaning up global test environment...')
  
  // Start browser for cleanup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Clean up test data if needed
    await cleanupTestData(page)
    
    // Clean up authentication if needed
    await cleanupAuthentication(page)
    
    console.log('Global teardown completed successfully')
  } catch (error) {
    console.error('Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close()
  }
}

async function cleanupTestData(page: any) {
  console.log('Cleaning up test data...')
  
  // Clear any test data that was created during tests
  // This might include clearing localStorage, sessionStorage, etc.
  
  try {
    await page.goto('http://localhost:3000')
    await page.evaluate(() => {
      // Clear localStorage
      localStorage.clear()
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Clear any IndexedDB data
      if ('indexedDB' in window) {
        // Note: In a real application, you might want to clear specific databases
        console.log('IndexedDB cleanup would go here')
      }
      
      // Clear any cookies
      document.cookie.split(';').forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      })
    })
    
    console.log('Test data cleanup completed')
  } catch (error) {
    console.error('Error during test data cleanup:', error)
  }
}

async function cleanupAuthentication(page: any) {
  console.log('Cleaning up authentication...')
  
  try {
    // Clear any authentication tokens or sessions
    await page.evaluate(() => {
      // Clear authentication tokens from localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      
      // Clear authentication cookies
      document.cookie = 'auth_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
      document.cookie = 'refresh_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
    })
    
    console.log('Authentication cleanup completed')
  } catch (error) {
    console.error('Error during authentication cleanup:', error)
  }
}

export default globalTeardown
