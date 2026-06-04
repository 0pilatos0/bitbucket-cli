/**
 * Application bootstrap - wires up all dependencies
 */

import { Container, ServiceTokens } from './core/container.js';
import {
  ConfigService,
  GitService,
  ContextService,
  OutputService,
  VersionService,
  OAuthService,
  createApiClient,
  SnippetFilesService,
  DefaultReviewerService,
  UrlBuilderService,
} from './services/index.js';
import type { AxiosInstance } from 'axios';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

// Import generated API classes
import {
  PullrequestsApi,
  RepositoriesApi,
  UsersApi,
  CommitStatusesApi,
  SnippetsApi,
} from './generated/api.js';

// Auth commands
import { LoginCommand } from './commands/auth/login.command.js';
import { LogoutCommand } from './commands/auth/logout.command.js';
import { StatusCommand } from './commands/auth/status.command.js';
import { TokenCommand } from './commands/auth/token.command.js';

// Repo commands
import { CloneCommand } from './commands/repo/clone.command.js';
import { CreateRepoCommand } from './commands/repo/create.command.js';
import { ListReposCommand } from './commands/repo/list.command.js';
import { ViewRepoCommand } from './commands/repo/view.command.js';
import { DeleteRepoCommand } from './commands/repo/delete.command.js';
import { ListDefaultReviewersCommand } from './commands/repo/default-reviewers.list.command.js';
import { AddDefaultReviewerCommand } from './commands/repo/default-reviewers.add.command.js';
import { RemoveDefaultReviewerCommand } from './commands/repo/default-reviewers.remove.command.js';

// PR commands
import { CreatePRCommand } from './commands/pr/create.command.js';
import { ListPRsCommand } from './commands/pr/list.command.js';
import { ViewPRCommand } from './commands/pr/view.command.js';
import { EditPRCommand } from './commands/pr/edit.command.js';
import { MergePRCommand } from './commands/pr/merge.command.js';
import { ApprovePRCommand } from './commands/pr/approve.command.js';
import { DeclinePRCommand } from './commands/pr/decline.command.js';
import { ReadyPRCommand } from './commands/pr/ready.command.js';
import { CheckoutPRCommand } from './commands/pr/checkout.command.js';
import { DiffPRCommand } from './commands/pr/diff.command.js';
import { ActivityPRCommand } from './commands/pr/activity.command.js';
import { CommentPRCommand } from './commands/pr/comment.command.js';
import { ListCommentsPRCommand } from './commands/pr/comments.list.command.js';
import { EditCommentPRCommand } from './commands/pr/comments.edit.command.js';
import { DeleteCommentPRCommand } from './commands/pr/comments.delete.command.js';
import { AddReviewerPRCommand } from './commands/pr/reviewers.add.command.js';
import { RemoveReviewerPRCommand } from './commands/pr/reviewers.remove.command.js';
import { ListReviewersPRCommand } from './commands/pr/reviewers.list.command.js';
import { ChecksPRCommand } from './commands/pr/checks.command.js';

// Snippet commands
import { ListSnippetsCommand } from './commands/snippet/list.command.js';
import { ViewSnippetCommand } from './commands/snippet/view.command.js';
import { CreateSnippetCommand } from './commands/snippet/create.command.js';
import { EditSnippetCommand } from './commands/snippet/edit.command.js';
import { DeleteSnippetCommand } from './commands/snippet/delete.command.js';
import { WatchSnippetCommand } from './commands/snippet/watch.command.js';
import { UnwatchSnippetCommand } from './commands/snippet/unwatch.command.js';
import { ListSnippetCommentsCommand } from './commands/snippet/comments.list.command.js';
import { AddSnippetCommentCommand } from './commands/snippet/comments.add.command.js';
import { EditSnippetCommentCommand } from './commands/snippet/comments.edit.command.js';
import { DeleteSnippetCommentCommand } from './commands/snippet/comments.delete.command.js';

// Config commands
import { GetConfigCommand } from './commands/config/get.command.js';
import { SetConfigCommand } from './commands/config/set.command.js';
import { ListConfigCommand } from './commands/config/list.command.js';

// Completion commands
import { InstallCompletionCommand } from './commands/completion/install.command.js';
import { UninstallCompletionCommand } from './commands/completion/uninstall.command.js';

// Top-level commands
import { BrowseCommand } from './commands/browse.command.js';
import { ApiCommand } from './commands/api.command.js';

export interface BootstrapOptions {
  noColor?: boolean;
  noUnicode?: boolean;
  locale?: string;
}

type Ctor<T> = new (...args: never[]) => T;

type ApiClientCtor<T> = new (
  cfg: undefined,
  basePath: undefined,
  axios: AxiosInstance
) => T;

/**
 * Register a generated OpenAPI client. Each client follows the same pattern:
 * pull ConfigService + OAuthService, build an axios instance, construct with
 * `new Ctor(undefined, undefined, axios)`.
 */
function registerApiClient<T>(
  container: Container,
  token: string,
  ctor: ApiClientCtor<T>
): void {
  container.register(token, () => {
    const credentialStore = container.resolve<ConfigService>(
      ServiceTokens.CredentialStore
    );
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    const outputService = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    const axiosInstance = createApiClient(
      credentialStore,
      outputService,
      oauthService
    );
    return new ctor(undefined, undefined, axiosInstance);
  });
}

/**
 * Register a command (or any class) that is constructed by resolving a list
 * of service tokens and passing them positionally to its constructor.
 */
function registerCommand<T>(
  container: Container,
  token: string,
  ctor: Ctor<T>,
  deps: readonly string[]
): void {
  container.register(token, () => {
    const resolved = deps.map((dep) => container.resolve(dep)) as never[];
    return new ctor(...resolved);
  });
}

export function bootstrap(options: BootstrapOptions = {}): Container {
  const container = Container.getInstance();

  // Core services. ConfigService backs both IConfigService (app config) and
  // ICredentialStore (basic + OAuth credentials); the CredentialStore token
  // resolves to the same singleton so storage stays in one JSON file while
  // consumers depend on narrower interfaces.
  container.register(ServiceTokens.ConfigService, () => new ConfigService());
  container.register(ServiceTokens.CredentialStore, () =>
    container.resolve<ConfigService>(ServiceTokens.ConfigService)
  );
  container.register(ServiceTokens.GitService, () => new GitService());
  container.register(
    ServiceTokens.OutputService,
    () =>
      new OutputService({
        noColor: options.noColor,
        noUnicode: options.noUnicode,
        locale: options.locale,
      })
  );
  registerCommand(container, ServiceTokens.OAuthService, OAuthService, [
    ServiceTokens.ConfigService,
    ServiceTokens.CredentialStore,
  ]);
  registerCommand(container, ServiceTokens.ContextService, ContextService, [
    ServiceTokens.GitService,
    ServiceTokens.ConfigService,
  ]);

  // API clients backed by a per-client axios instance
  registerApiClient(container, ServiceTokens.PullrequestsApi, PullrequestsApi);
  registerApiClient(container, ServiceTokens.RepositoriesApi, RepositoriesApi);
  registerApiClient(container, ServiceTokens.UsersApi, UsersApi);
  registerApiClient(
    container,
    ServiceTokens.CommitStatusesApi,
    CommitStatusesApi
  );

  // Snippets share one axios instance between the generated API and the
  // raw-file helper service, so they register the axios separately.
  container.register(ServiceTokens.SnippetsAxios, () => {
    const credentialStore = container.resolve<ConfigService>(
      ServiceTokens.CredentialStore
    );
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    const outputService = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return createApiClient(credentialStore, outputService, oauthService);
  });
  container.register(ServiceTokens.SnippetsApi, () => {
    const axiosInstance = container.resolve<AxiosInstance>(
      ServiceTokens.SnippetsAxios
    );
    return new SnippetsApi(undefined, undefined, axiosInstance);
  });
  registerCommand(
    container,
    ServiceTokens.SnippetFilesService,
    SnippetFilesService,
    [ServiceTokens.SnippetsAxios]
  );

  registerCommand(
    container,
    ServiceTokens.DefaultReviewerService,
    DefaultReviewerService,
    [ServiceTokens.PullrequestsApi]
  );

  // URL builder is a pure helper with no dependencies; register a fresh
  // singleton so tests can swap the base via `registerInstance` if needed.
  container.register(
    ServiceTokens.UrlBuilderService,
    () => new UrlBuilderService()
  );

  // Auth commands
  registerCommand(container, ServiceTokens.LoginCommand, LoginCommand, [
    ServiceTokens.CredentialStore,
    ServiceTokens.UsersApi,
    ServiceTokens.OAuthService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.LogoutCommand, LogoutCommand, [
    ServiceTokens.CredentialStore,
    ServiceTokens.OAuthService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.StatusCommand, StatusCommand, [
    ServiceTokens.ConfigService,
    ServiceTokens.CredentialStore,
    ServiceTokens.UsersApi,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.TokenCommand, TokenCommand, [
    ServiceTokens.CredentialStore,
    ServiceTokens.OAuthService,
    ServiceTokens.OutputService,
  ]);

  // Repo commands
  registerCommand(container, ServiceTokens.CloneCommand, CloneCommand, [
    ServiceTokens.GitService,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(
    container,
    ServiceTokens.CreateRepoCommand,
    CreateRepoCommand,
    [
      ServiceTokens.RepositoriesApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(container, ServiceTokens.ListReposCommand, ListReposCommand, [
    ServiceTokens.RepositoriesApi,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.ViewRepoCommand, ViewRepoCommand, [
    ServiceTokens.RepositoriesApi,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(
    container,
    ServiceTokens.DeleteRepoCommand,
    DeleteRepoCommand,
    [
      ServiceTokens.RepositoriesApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.ListDefaultReviewersCommand,
    ListDefaultReviewersCommand,
    [
      ServiceTokens.DefaultReviewerService,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.AddDefaultReviewerCommand,
    AddDefaultReviewerCommand,
    [
      ServiceTokens.DefaultReviewerService,
      ServiceTokens.UsersApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.RemoveDefaultReviewerCommand,
    RemoveDefaultReviewerCommand,
    [
      ServiceTokens.DefaultReviewerService,
      ServiceTokens.UsersApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );

  // PR commands
  registerCommand(container, ServiceTokens.CreatePRCommand, CreatePRCommand, [
    ServiceTokens.PullrequestsApi,
    ServiceTokens.UsersApi,
    ServiceTokens.ContextService,
    ServiceTokens.GitService,
    ServiceTokens.DefaultReviewerService,
    ServiceTokens.ConfigService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.ListPRsCommand, ListPRsCommand, [
    ServiceTokens.PullrequestsApi,
    ServiceTokens.UsersApi,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.ViewPRCommand, ViewPRCommand, [
    ServiceTokens.PullrequestsApi,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.EditPRCommand, EditPRCommand, [
    ServiceTokens.PullrequestsApi,
    ServiceTokens.ContextService,
    ServiceTokens.GitService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.MergePRCommand, MergePRCommand, [
    ServiceTokens.PullrequestsApi,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.ApprovePRCommand, ApprovePRCommand, [
    ServiceTokens.PullrequestsApi,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.DeclinePRCommand, DeclinePRCommand, [
    ServiceTokens.PullrequestsApi,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.ReadyPRCommand, ReadyPRCommand, [
    ServiceTokens.PullrequestsApi,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(
    container,
    ServiceTokens.CheckoutPRCommand,
    CheckoutPRCommand,
    [
      ServiceTokens.PullrequestsApi,
      ServiceTokens.ContextService,
      ServiceTokens.GitService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(container, ServiceTokens.DiffPRCommand, DiffPRCommand, [
    ServiceTokens.PullrequestsApi,
    ServiceTokens.ContextService,
    ServiceTokens.GitService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(
    container,
    ServiceTokens.ActivityPRCommand,
    ActivityPRCommand,
    [
      ServiceTokens.PullrequestsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(container, ServiceTokens.CommentPRCommand, CommentPRCommand, [
    ServiceTokens.PullrequestsApi,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(
    container,
    ServiceTokens.ListCommentsPRCommand,
    ListCommentsPRCommand,
    [
      ServiceTokens.PullrequestsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.EditCommentPRCommand,
    EditCommentPRCommand,
    [
      ServiceTokens.PullrequestsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.DeleteCommentPRCommand,
    DeleteCommentPRCommand,
    [
      ServiceTokens.PullrequestsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.AddReviewerPRCommand,
    AddReviewerPRCommand,
    [
      ServiceTokens.PullrequestsApi,
      ServiceTokens.UsersApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.RemoveReviewerPRCommand,
    RemoveReviewerPRCommand,
    [
      ServiceTokens.PullrequestsApi,
      ServiceTokens.UsersApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.ListReviewersPRCommand,
    ListReviewersPRCommand,
    [
      ServiceTokens.PullrequestsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(container, ServiceTokens.ChecksPRCommand, ChecksPRCommand, [
    ServiceTokens.CommitStatusesApi,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);

  // Snippet commands
  registerCommand(
    container,
    ServiceTokens.ListSnippetsCommand,
    ListSnippetsCommand,
    [
      ServiceTokens.SnippetsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.ViewSnippetCommand,
    ViewSnippetCommand,
    [
      ServiceTokens.SnippetsApi,
      ServiceTokens.SnippetFilesService,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.CreateSnippetCommand,
    CreateSnippetCommand,
    [
      ServiceTokens.SnippetFilesService,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.EditSnippetCommand,
    EditSnippetCommand,
    [
      ServiceTokens.SnippetFilesService,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.DeleteSnippetCommand,
    DeleteSnippetCommand,
    [
      ServiceTokens.SnippetsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.WatchSnippetCommand,
    WatchSnippetCommand,
    [
      ServiceTokens.SnippetsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.UnwatchSnippetCommand,
    UnwatchSnippetCommand,
    [
      ServiceTokens.SnippetsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.ListSnippetCommentsCommand,
    ListSnippetCommentsCommand,
    [
      ServiceTokens.SnippetsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.AddSnippetCommentCommand,
    AddSnippetCommentCommand,
    [
      ServiceTokens.SnippetsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.EditSnippetCommentCommand,
    EditSnippetCommentCommand,
    [
      ServiceTokens.SnippetsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );
  registerCommand(
    container,
    ServiceTokens.DeleteSnippetCommentCommand,
    DeleteSnippetCommentCommand,
    [
      ServiceTokens.SnippetsApi,
      ServiceTokens.ContextService,
      ServiceTokens.OutputService,
    ]
  );

  // Config commands
  registerCommand(container, ServiceTokens.GetConfigCommand, GetConfigCommand, [
    ServiceTokens.ConfigService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(container, ServiceTokens.SetConfigCommand, SetConfigCommand, [
    ServiceTokens.ConfigService,
    ServiceTokens.OutputService,
  ]);
  registerCommand(
    container,
    ServiceTokens.ListConfigCommand,
    ListConfigCommand,
    [ServiceTokens.ConfigService, ServiceTokens.OutputService]
  );

  // Top-level commands
  registerCommand(container, ServiceTokens.BrowseCommand, BrowseCommand, [
    ServiceTokens.ContextService,
    ServiceTokens.GitService,
    ServiceTokens.UrlBuilderService,
    ServiceTokens.OutputService,
  ]);

  // Raw API passthrough (bb api). Uses its own axios instance built from the
  // authenticated stack, mirroring the SnippetsAxios pattern.
  container.register(ServiceTokens.ApiAxios, () => {
    const credentialStore = container.resolve<ConfigService>(
      ServiceTokens.CredentialStore
    );
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    const outputService = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return createApiClient(credentialStore, outputService, oauthService);
  });
  registerCommand(container, ServiceTokens.ApiCommand, ApiCommand, [
    ServiceTokens.ApiAxios,
    ServiceTokens.ContextService,
    ServiceTokens.OutputService,
  ]);

  // Completion commands
  registerCommand(
    container,
    ServiceTokens.InstallCompletionCommand,
    InstallCompletionCommand,
    [ServiceTokens.OutputService]
  );
  registerCommand(
    container,
    ServiceTokens.UninstallCompletionCommand,
    UninstallCompletionCommand,
    [ServiceTokens.OutputService]
  );

  // Version service (needs package version)
  container.register(ServiceTokens.VersionService, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    return new VersionService(configService, pkg.version);
  });

  return container;
}
