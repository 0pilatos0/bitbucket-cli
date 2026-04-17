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

export interface BootstrapOptions {
  noColor?: boolean;
}

export function bootstrap(options: BootstrapOptions = {}): Container {
  const container = Container.getInstance();

  // Register core services
  container.register(ServiceTokens.ConfigService, () => new ConfigService());
  container.register(ServiceTokens.GitService, () => new GitService());
  container.register(
    ServiceTokens.OutputService,
    () => new OutputService({ noColor: options.noColor })
  );

  // Register OAuth service
  container.register(ServiceTokens.OAuthService, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    return new OAuthService(configService);
  });

  // Register API clients with axios instance
  container.register(ServiceTokens.PullrequestsApi, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    const axiosInstance = createApiClient(configService, oauthService);
    return new PullrequestsApi(undefined, undefined, axiosInstance);
  });

  container.register(ServiceTokens.RepositoriesApi, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    const axiosInstance = createApiClient(configService, oauthService);
    return new RepositoriesApi(undefined, undefined, axiosInstance);
  });

  container.register(ServiceTokens.UsersApi, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    const axiosInstance = createApiClient(configService, oauthService);
    return new UsersApi(undefined, undefined, axiosInstance);
  });

  container.register(ServiceTokens.CommitStatusesApi, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    const axiosInstance = createApiClient(configService, oauthService);
    return new CommitStatusesApi(undefined, undefined, axiosInstance);
  });

  container.register(ServiceTokens.SnippetsAxios, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    return createApiClient(configService, oauthService);
  });

  container.register(ServiceTokens.SnippetsApi, () => {
    const axiosInstance = container.resolve<AxiosInstance>(
      ServiceTokens.SnippetsAxios
    );
    return new SnippetsApi(undefined, undefined, axiosInstance);
  });

  container.register(ServiceTokens.SnippetFilesService, () => {
    const axiosInstance = container.resolve<AxiosInstance>(
      ServiceTokens.SnippetsAxios
    );
    return new SnippetFilesService(axiosInstance);
  });

  container.register(ServiceTokens.ContextService, () => {
    const gitService = container.resolve<GitService>(ServiceTokens.GitService);
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    return new ContextService(gitService, configService);
  });

  // Register auth commands
  container.register(ServiceTokens.LoginCommand, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const usersApi = container.resolve<UsersApi>(ServiceTokens.UsersApi);
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new LoginCommand(configService, usersApi, oauthService, output);
  });

  container.register(ServiceTokens.LogoutCommand, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new LogoutCommand(configService, oauthService, output);
  });

  container.register(ServiceTokens.StatusCommand, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const usersApi = container.resolve<UsersApi>(ServiceTokens.UsersApi);
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new StatusCommand(configService, usersApi, output);
  });

  container.register(ServiceTokens.TokenCommand, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const oauthService = container.resolve<OAuthService>(
      ServiceTokens.OAuthService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new TokenCommand(configService, oauthService, output);
  });

  // Register repo commands
  container.register(ServiceTokens.CloneCommand, () => {
    const gitService = container.resolve<GitService>(ServiceTokens.GitService);
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new CloneCommand(gitService, configService, output);
  });

  container.register(ServiceTokens.CreateRepoCommand, () => {
    const repositoriesApi = container.resolve<RepositoriesApi>(
      ServiceTokens.RepositoriesApi
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new CreateRepoCommand(repositoriesApi, configService, output);
  });

  container.register(ServiceTokens.ListReposCommand, () => {
    const repositoriesApi = container.resolve<RepositoriesApi>(
      ServiceTokens.RepositoriesApi
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ListReposCommand(repositoriesApi, configService, output);
  });

  container.register(ServiceTokens.ViewRepoCommand, () => {
    const repositoriesApi = container.resolve<RepositoriesApi>(
      ServiceTokens.RepositoriesApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ViewRepoCommand(repositoriesApi, contextService, output);
  });

  container.register(ServiceTokens.DeleteRepoCommand, () => {
    const repositoriesApi = container.resolve<RepositoriesApi>(
      ServiceTokens.RepositoriesApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new DeleteRepoCommand(repositoriesApi, contextService, output);
  });

  // Register default reviewer service
  container.register(ServiceTokens.DefaultReviewerService, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    return new DefaultReviewerService(pullrequestsApi);
  });

  container.register(ServiceTokens.ListDefaultReviewersCommand, () => {
    const service = container.resolve<DefaultReviewerService>(
      ServiceTokens.DefaultReviewerService
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ListDefaultReviewersCommand(service, contextService, output);
  });

  container.register(ServiceTokens.AddDefaultReviewerCommand, () => {
    const service = container.resolve<DefaultReviewerService>(
      ServiceTokens.DefaultReviewerService
    );
    const usersApi = container.resolve<UsersApi>(ServiceTokens.UsersApi);
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new AddDefaultReviewerCommand(
      service,
      usersApi,
      contextService,
      output
    );
  });

  container.register(ServiceTokens.RemoveDefaultReviewerCommand, () => {
    const service = container.resolve<DefaultReviewerService>(
      ServiceTokens.DefaultReviewerService
    );
    const usersApi = container.resolve<UsersApi>(ServiceTokens.UsersApi);
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new RemoveDefaultReviewerCommand(
      service,
      usersApi,
      contextService,
      output
    );
  });

  // Register PR commands
  container.register(ServiceTokens.CreatePRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const usersApi = container.resolve<UsersApi>(ServiceTokens.UsersApi);
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const gitService = container.resolve<GitService>(ServiceTokens.GitService);
    const defaultReviewerService = container.resolve<DefaultReviewerService>(
      ServiceTokens.DefaultReviewerService
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new CreatePRCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      gitService,
      defaultReviewerService,
      configService,
      output
    );
  });

  container.register(ServiceTokens.ListPRsCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const usersApi = container.resolve<UsersApi>(ServiceTokens.UsersApi);
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ListPRsCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
  });

  container.register(ServiceTokens.ViewPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ViewPRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.EditPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const gitService = container.resolve<GitService>(ServiceTokens.GitService);
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new EditPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
  });

  container.register(ServiceTokens.MergePRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new MergePRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.ApprovePRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ApprovePRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.DeclinePRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new DeclinePRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.ReadyPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ReadyPRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.CheckoutPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const gitService = container.resolve<GitService>(ServiceTokens.GitService);
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new CheckoutPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
  });

  container.register(ServiceTokens.DiffPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const gitService = container.resolve<GitService>(ServiceTokens.GitService);
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new DiffPRCommand(
      pullrequestsApi,
      contextService,
      gitService,
      output
    );
  });

  container.register(ServiceTokens.ActivityPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ActivityPRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.CommentPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new CommentPRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.ListCommentsPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ListCommentsPRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.EditCommentPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new EditCommentPRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.DeleteCommentPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new DeleteCommentPRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.AddReviewerPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const usersApi = container.resolve<UsersApi>(ServiceTokens.UsersApi);
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new AddReviewerPRCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
  });

  container.register(ServiceTokens.RemoveReviewerPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const usersApi = container.resolve<UsersApi>(ServiceTokens.UsersApi);
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new RemoveReviewerPRCommand(
      pullrequestsApi,
      usersApi,
      contextService,
      output
    );
  });

  container.register(ServiceTokens.ListReviewersPRCommand, () => {
    const pullrequestsApi = container.resolve<PullrequestsApi>(
      ServiceTokens.PullrequestsApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ListReviewersPRCommand(pullrequestsApi, contextService, output);
  });

  container.register(ServiceTokens.ChecksPRCommand, () => {
    const commitStatusesApi = container.resolve<CommitStatusesApi>(
      ServiceTokens.CommitStatusesApi
    );
    const contextService = container.resolve<ContextService>(
      ServiceTokens.ContextService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ChecksPRCommand(commitStatusesApi, contextService, output);
  });

  // Register snippet commands
  container.register(ServiceTokens.ListSnippetsCommand, () => {
    const snippetsApi = container.resolve<SnippetsApi>(
      ServiceTokens.SnippetsApi
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ListSnippetsCommand(snippetsApi, configService, output);
  });

  container.register(ServiceTokens.ViewSnippetCommand, () => {
    const snippetsApi = container.resolve<SnippetsApi>(
      ServiceTokens.SnippetsApi
    );
    const snippetFilesService = container.resolve<SnippetFilesService>(
      ServiceTokens.SnippetFilesService
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ViewSnippetCommand(
      snippetsApi,
      snippetFilesService,
      configService,
      output
    );
  });

  container.register(ServiceTokens.CreateSnippetCommand, () => {
    const snippetFilesService = container.resolve<SnippetFilesService>(
      ServiceTokens.SnippetFilesService
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new CreateSnippetCommand(snippetFilesService, configService, output);
  });

  container.register(ServiceTokens.EditSnippetCommand, () => {
    const snippetFilesService = container.resolve<SnippetFilesService>(
      ServiceTokens.SnippetFilesService
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new EditSnippetCommand(snippetFilesService, configService, output);
  });

  container.register(ServiceTokens.DeleteSnippetCommand, () => {
    const snippetsApi = container.resolve<SnippetsApi>(
      ServiceTokens.SnippetsApi
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new DeleteSnippetCommand(snippetsApi, configService, output);
  });

  container.register(ServiceTokens.WatchSnippetCommand, () => {
    const snippetsApi = container.resolve<SnippetsApi>(
      ServiceTokens.SnippetsApi
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new WatchSnippetCommand(snippetsApi, configService, output);
  });

  container.register(ServiceTokens.UnwatchSnippetCommand, () => {
    const snippetsApi = container.resolve<SnippetsApi>(
      ServiceTokens.SnippetsApi
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new UnwatchSnippetCommand(snippetsApi, configService, output);
  });

  container.register(ServiceTokens.ListSnippetCommentsCommand, () => {
    const snippetsApi = container.resolve<SnippetsApi>(
      ServiceTokens.SnippetsApi
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ListSnippetCommentsCommand(snippetsApi, configService, output);
  });

  container.register(ServiceTokens.AddSnippetCommentCommand, () => {
    const snippetsApi = container.resolve<SnippetsApi>(
      ServiceTokens.SnippetsApi
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new AddSnippetCommentCommand(snippetsApi, configService, output);
  });

  container.register(ServiceTokens.EditSnippetCommentCommand, () => {
    const snippetsApi = container.resolve<SnippetsApi>(
      ServiceTokens.SnippetsApi
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new EditSnippetCommentCommand(snippetsApi, configService, output);
  });

  container.register(ServiceTokens.DeleteSnippetCommentCommand, () => {
    const snippetsApi = container.resolve<SnippetsApi>(
      ServiceTokens.SnippetsApi
    );
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new DeleteSnippetCommentCommand(snippetsApi, configService, output);
  });

  // Register config commands
  container.register(ServiceTokens.GetConfigCommand, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new GetConfigCommand(configService, output);
  });

  container.register(ServiceTokens.SetConfigCommand, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new SetConfigCommand(configService, output);
  });

  container.register(ServiceTokens.ListConfigCommand, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new ListConfigCommand(configService, output);
  });

  // Register completion commands
  container.register(ServiceTokens.InstallCompletionCommand, () => {
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new InstallCompletionCommand(output);
  });

  container.register(ServiceTokens.UninstallCompletionCommand, () => {
    const output = container.resolve<OutputService>(
      ServiceTokens.OutputService
    );
    return new UninstallCompletionCommand(output);
  });

  // Register version service
  container.register(ServiceTokens.VersionService, () => {
    const configService = container.resolve<ConfigService>(
      ServiceTokens.ConfigService
    );
    return new VersionService(configService, pkg.version);
  });

  return container;
}
