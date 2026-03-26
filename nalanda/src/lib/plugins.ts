/**
 * Nalanda Plugin System
 * 
 * Plugins can register:
 * - Components (to be rendered in specific areas)
 * - Routes (API endpoints)
 * - Hooks (to modify behavior)
 */

export interface PluginConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
}

export interface Plugin {
  config: PluginConfig;
  
  // Register components for specific slots
  components?: {
    header?: React.ComponentType;
    footer?: React.ComponentType;
    sidebar?: React.ComponentType;
    postActions?: React.ComponentType;
    conceptActions?: React.ComponentType;
  };
  
  // Register API routes
  routes?: {
    path: string;
    handler: (request: Request) => Promise<Response>;
  }[];
  
  // Lifecycle hooks
  onInit?: () => void | Promise<void>;
  onShutdown?: () => void | Promise<void>;
  
  // Content processors
  processContent?: (content: string) => string;
  processBacklinks?: (backlinks: string[]) => string[];
}

/**
 * Plugin Registry
 * Singleton to manage loaded plugins
 */
class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, Plugin> = new Map();

  private constructor() {}

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.config.id)) {
      console.warn(`Plugin ${plugin.config.id} is already registered`);
      return;
    }

    this.plugins.set(plugin.config.id, plugin);

    if (plugin.onInit) {
      const result = plugin.onInit();
      if (result instanceof Promise) {
        result.catch(console.error);
      }
    }

    console.log(`Plugin registered: ${plugin.config.name} v${plugin.config.version}`);
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    if (plugin.onShutdown) {
      await plugin.onShutdown();
    }

    this.plugins.delete(pluginId);
    console.log(`Plugin unregistered: ${plugin.config.name}`);
  }

  /**
   * Get a registered plugin
   */
  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all registered plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all components for a specific slot
   */
  getComponentsForSlot(slot: keyof NonNullable<Plugin['components']>): React.ComponentType[] {
    const components: React.ComponentType[] = [];

    for (const plugin of Array.from(this.plugins.values())) {
      if (plugin.components?.[slot]) {
        components.push(plugin.components[slot]!);
      }
    }

    return components;
  }

  /**
   * Process content through all plugins
   */
  processContent(content: string): string {
    let processed = content;

    for (const plugin of Array.from(this.plugins.values())) {
      if (plugin.processContent) {
        processed = plugin.processContent(processed);
      }
    }

    return processed;
  }

  /**
   * Process backlinks through all plugins
   */
  processBacklinks(backlinks: string[]): string[] {
    let processed = [...backlinks];

    for (const plugin of Array.from(this.plugins.values())) {
      if (plugin.processBacklinks) {
        processed = plugin.processBacklinks(processed);
      }
    }

    return processed;
  }
}

export const pluginRegistry = PluginRegistry.getInstance();

/**
 * Helper to create a plugin
 */
export function createPlugin(config: PluginConfig): PluginBuilder {
  return new PluginBuilder(config);
}

export class PluginBuilder {
  private plugin: Partial<Plugin> = {};

  constructor(config: PluginConfig) {
    this.plugin.config = config;
  }

  components(components: NonNullable<Plugin['components']>): PluginBuilder {
    this.plugin.components = components;
    return this;
  }

  routes(routes: NonNullable<Plugin['routes']>): PluginBuilder {
    this.plugin.routes = routes;
    return this;
  }

  onInit(fn: () => void | Promise<void>): PluginBuilder {
    this.plugin.onInit = fn;
    return this;
  }

  onShutdown(fn: () => void | Promise<void>): PluginBuilder {
    this.plugin.onShutdown = fn;
    return this;
  }

  processContent(fn: (content: string) => string): PluginBuilder {
    this.plugin.processContent = fn;
    return this;
  }

  processBacklinks(fn: (backlinks: string[]) => string[]): PluginBuilder {
    this.plugin.processBacklinks = fn;
    return this;
  }

  build(): Plugin {
    return this.plugin as Plugin;
  }

  register(): void {
    const plugin = this.build();
    pluginRegistry.register(plugin);
  }
}
