/**
 * Dependency Injection Container
 * Simple IoC container for managing service dependencies
 */

type Constructor<T> = new (...args: unknown[]) => T;
type Factory<T> = () => T;

interface ServiceRegistration<T> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

export class Container {
  private readonly services = new Map<string, ServiceRegistration<unknown>>();
  private static instance: Container | null = null;

  /**
   * Get the singleton container instance
   */
  public static getInstance(): Container {
    Container.instance ??= new Container();
    return Container.instance;
  }

  /**
   * Reset the container (useful for testing)
   */
  public static reset(): void {
    Container.instance = null;
  }

  /**
   * Register a service with a factory function
   */
  public register<T>(
    token: string,
    factory: Factory<T>,
    options: { singleton?: boolean } = {}
  ): this {
    this.services.set(token, {
      factory,
      singleton: options.singleton ?? true,
    });
    return this;
  }

  /**
   * Register a service instance directly
   */
  public registerInstance<T>(token: string, instance: T): this {
    this.services.set(token, {
      factory: () => instance,
      singleton: true,
      instance,
    });
    return this;
  }

  /**
   * Register a class with automatic instantiation
   */
  public registerClass<T>(
    token: string,
    constructor: Constructor<T>,
    dependencies: string[] = [],
    options: { singleton?: boolean } = {}
  ): this {
    this.services.set(token, {
      factory: () => {
        const deps = dependencies.map((dep) => this.resolve(dep));
        return new constructor(...deps);
      },
      singleton: options.singleton ?? true,
    });
    return this;
  }

  /**
   * Resolve a service by token
   */
  public resolve<T>(token: string): T {
    const registration = this.services.get(token);

    if (!registration) {
      throw new Error(`Service not registered: ${token}`);
    }

    if (registration.singleton) {
      if (!registration.instance) {
        registration.instance = registration.factory();
      }
      return registration.instance as T;
    }

    return registration.factory() as T;
  }

  /**
   * Check if a service is registered
   */
  public has(token: string): boolean {
    return this.services.has(token);
  }

  /**
   * Unregister a service
   */
  public unregister(token: string): boolean {
    return this.services.delete(token);
  }

  /**
   * Clear all registrations
   */
  public clear(): void {
    this.services.clear();
  }
}

/**
 * Service tokens for dependency injection
 */
export const ServiceTokens = {
  // Core services
  ConfigService: 'ConfigService',
  CredentialStore: 'CredentialStore',
  GitService: 'GitService',
  ContextService: 'ContextService',
  OutputService: 'OutputService',
  OAuthService: 'OAuthService',
  VersionService: 'VersionService',

  // API Clients
  SharedApiAxios: 'SharedApiAxios',
  PullrequestsApi: 'PullrequestsApi',
  RepositoriesApi: 'RepositoriesApi',
  UsersApi: 'UsersApi',
  CommitStatusesApi: 'CommitStatusesApi',
  CommitsApi: 'CommitsApi',
  PipelinesApi: 'PipelinesApi',
  IssueTrackerApi: 'IssueTrackerApi',
  WorkspacesApi: 'WorkspacesApi',
  ProjectsApi: 'ProjectsApi',

  // Commands - Auth
  LoginCommand: 'LoginCommand',
  LogoutCommand: 'LogoutCommand',
  StatusCommand: 'StatusCommand',
  TokenCommand: 'TokenCommand',

  // Commands - Repo
  CloneCommand: 'CloneCommand',
  CreateRepoCommand: 'CreateRepoCommand',
  ListReposCommand: 'ListReposCommand',
  ViewRepoCommand: 'ViewRepoCommand',
  DeleteRepoCommand: 'DeleteRepoCommand',
  ListDefaultReviewersCommand: 'ListDefaultReviewersCommand',
  AddDefaultReviewerCommand: 'AddDefaultReviewerCommand',
  RemoveDefaultReviewerCommand: 'RemoveDefaultReviewerCommand',

  // Services - Default Reviewers
  DefaultReviewerService: 'DefaultReviewerService',

  // Services - URL builder (Bitbucket web URL construction)
  UrlBuilderService: 'UrlBuilderService',

  // Commands - Top level
  BrowseCommand: 'BrowseCommand',
  ApiCommand: 'ApiCommand',

  // Commands - PR
  CreatePRCommand: 'CreatePRCommand',
  ListPRsCommand: 'ListPRsCommand',
  ViewPRCommand: 'ViewPRCommand',
  EditPRCommand: 'EditPRCommand',
  MergePRCommand: 'MergePRCommand',
  ApprovePRCommand: 'ApprovePRCommand',
  DeclinePRCommand: 'DeclinePRCommand',
  ReadyPRCommand: 'ReadyPRCommand',
  CheckoutPRCommand: 'CheckoutPRCommand',
  DiffPRCommand: 'DiffPRCommand',
  ActivityPRCommand: 'ActivityPRCommand',
  ChecksPRCommand: 'ChecksPRCommand',
  CommentPRCommand: 'CommentPRCommand',
  ListCommentsPRCommand: 'ListCommentsPRCommand',
  EditCommentPRCommand: 'EditCommentPRCommand',
  DeleteCommentPRCommand: 'DeleteCommentPRCommand',
  ResolveCommentPRCommand: 'ResolveCommentPRCommand',
  UnresolveCommentPRCommand: 'UnresolveCommentPRCommand',
  ViewCommentPRCommand: 'ViewCommentPRCommand',
  ReplyCommentPRCommand: 'ReplyCommentPRCommand',
  AddReviewerPRCommand: 'AddReviewerPRCommand',
  RemoveReviewerPRCommand: 'RemoveReviewerPRCommand',
  ListReviewersPRCommand: 'ListReviewersPRCommand',

  // API Clients - Snippets
  SnippetsApi: 'SnippetsApi',
  SnippetFilesService: 'SnippetFilesService',

  // Commands - Snippet
  ListSnippetsCommand: 'ListSnippetsCommand',
  ViewSnippetCommand: 'ViewSnippetCommand',
  CreateSnippetCommand: 'CreateSnippetCommand',
  EditSnippetCommand: 'EditSnippetCommand',
  DeleteSnippetCommand: 'DeleteSnippetCommand',
  WatchSnippetCommand: 'WatchSnippetCommand',
  UnwatchSnippetCommand: 'UnwatchSnippetCommand',
  ListSnippetCommentsCommand: 'ListSnippetCommentsCommand',
  AddSnippetCommentCommand: 'AddSnippetCommentCommand',
  EditSnippetCommentCommand: 'EditSnippetCommentCommand',
  DeleteSnippetCommentCommand: 'DeleteSnippetCommentCommand',

  // Commands - Pipeline
  ListPipelinesCommand: 'ListPipelinesCommand',
  ViewPipelineCommand: 'ViewPipelineCommand',
  RunPipelineCommand: 'RunPipelineCommand',
  StopPipelineCommand: 'StopPipelineCommand',
  LogsPipelineCommand: 'LogsPipelineCommand',

  // Commands - Commit
  ListCommitsCommand: 'ListCommitsCommand',
  ViewCommitCommand: 'ViewCommitCommand',

  // Commands - Status (commit build statuses)
  ListCommitStatusesCommand: 'ListCommitStatusesCommand',
  SetCommitStatusCommand: 'SetCommitStatusCommand',

  // Commands - Issue
  ListIssuesCommand: 'ListIssuesCommand',
  ViewIssueCommand: 'ViewIssueCommand',
  CreateIssueCommand: 'CreateIssueCommand',
  EditIssueCommand: 'EditIssueCommand',
  CloseIssueCommand: 'CloseIssueCommand',
  CommentIssueCommand: 'CommentIssueCommand',

  // Commands - Workspace
  ListWorkspacesCommand: 'ListWorkspacesCommand',
  ViewWorkspaceCommand: 'ViewWorkspaceCommand',

  // Commands - Project
  ListProjectsCommand: 'ListProjectsCommand',
  ViewProjectCommand: 'ViewProjectCommand',
  CreateProjectCommand: 'CreateProjectCommand',

  // Commands - Config
  GetConfigCommand: 'GetConfigCommand',
  SetConfigCommand: 'SetConfigCommand',
  ListConfigCommand: 'ListConfigCommand',

  // Commands - Alias
  SetAliasCommand: 'SetAliasCommand',
  ListAliasesCommand: 'ListAliasesCommand',
  DeleteAliasCommand: 'DeleteAliasCommand',

  // Commands - Completion
  InstallCompletionCommand: 'InstallCompletionCommand',
  UninstallCompletionCommand: 'UninstallCompletionCommand',
} as const;

export type ServiceToken = (typeof ServiceTokens)[keyof typeof ServiceTokens];
