/**
 * Example Plugin
 * 
 * This is a template for creating Nalanda plugins.
 * Plugins can extend functionality by:
 * - Adding UI components
 * - Registering API routes
 * - Processing content
 * - Modifying behavior through hooks
 */

import { createPlugin } from '@/lib/plugins';

// Example component that could be added to the UI
function ExampleWidget() {
  return null; // Placeholder - implement your component here
}

// Create and register the plugin
const examplePlugin = createPlugin({
  id: 'example-plugin',
  name: 'Example Plugin',
  version: '1.0.0',
  description: 'An example plugin demonstrating the Nalanda plugin system',
  author: 'Nalanda Team',
})
  // Register components for specific UI slots
  .components({
    // These would be rendered in header, footer, sidebar, etc.
    // sidebar: ExampleWidget,
  })
  
  // Register custom API routes
  .routes([
    {
      path: '/api/plugins/example',
      handler: async (request: Request) => {
        return Response.json({
          message: 'Hello from Example Plugin!',
          timestamp: new Date().toISOString(),
        });
      },
    },
  ])
  
  // Initialize plugin
  .onInit(() => {
    console.log('Example Plugin initialized!');
  })
  
  // Cleanup on shutdown
  .onShutdown(() => {
    console.log('Example Plugin shutting down...');
  })
  
  // Process content before rendering
  .processContent((content) => {
    // Example: Add a watermark to all content
    return content;
  })
  
  // Register the plugin
  .register();

export default examplePlugin;
