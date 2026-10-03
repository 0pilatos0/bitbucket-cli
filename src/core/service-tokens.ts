/**
 * Service token catalog: one typed token per registered service and command
 */

import { token } from './token.js';
import type { Token, TokenType } from './token.js';
import type { AxiosInstance } from 'axios';
import type {
  ICredentialStore,
  IGitService,
  IContextService,
  IOutputService,
  IPromptService,
  ISnippetFilesService,
} from './interfaces/services.js';
import type { BaseCommand } from './base-command.js';
import type { IUrlBuilderService } from '../services/url-builder.service.js';
import type { ConfigService } from '../services/config.service.js';
import type { OAuthService } from '../services/oauth.service.js';
import type { VersionService } from '../services/version.service.js';
import type { DefaultReviewerService } from '../services/default-reviewer.service.js';
import type { UserResolverService } from '../services/user-resolver.service.js';
import type {
  PullrequestsApi,
  RepositoriesApi,
  UsersApi,
  CommitStatusesApi,
  CommitsApi,
  SnippetsApi,
  PipelinesApi,
  WorkspacesApi,
  ProjectsApi,
  SourceApi,
  DownloadsApi,
  SearchApi,
  WebhooksApi,
  BranchRestrictionsApi,
  SSHApi,
  GPGApi,
  DeploymentsApi,
} from '../generated/api.js';

import type { LoginCommand } from '../commands/auth/login.command.js';
import type { LogoutCommand } from '../commands/auth/logout.command.js';
import type { StatusCommand } from '../commands/auth/status.command.js';
import type { TokenCommand } from '../commands/auth/token.command.js';
import type { SwitchCommand } from '../commands/auth/switch.command.js';
import type { CloneCommand } from '../commands/repo/clone.command.js';
import type { CreateRepoCommand } from '../commands/repo/create.command.js';
import type { ListReposCommand } from '../commands/repo/list.command.js';
import type { ViewRepoCommand } from '../commands/repo/view.command.js';
import type { DeleteRepoCommand } from '../commands/repo/delete.command.js';
import type { ListDefaultReviewersCommand } from '../commands/repo/default-reviewers.list.command.js';
import type { AddDefaultReviewerCommand } from '../commands/repo/default-reviewers.add.command.js';
import type { RemoveDefaultReviewerCommand } from '../commands/repo/default-reviewers.remove.command.js';
import type { CatRepoFileCommand } from '../commands/repo/cat.command.js';
import type { ListRepoFilesCommand } from '../commands/repo/ls.command.js';
import type { ListDownloadsCommand } from '../commands/repo/downloads.list.command.js';
import type { UploadDownloadCommand } from '../commands/repo/downloads.upload.command.js';
import type { DeleteDownloadCommand } from '../commands/repo/downloads.delete.command.js';
import type { CreatePRCommand } from '../commands/pr/create.command.js';
import type { ListPRsCommand } from '../commands/pr/list.command.js';
import type { ViewPRCommand } from '../commands/pr/view.command.js';
import type { EditPRCommand } from '../commands/pr/edit.command.js';
import type { MergePRCommand } from '../commands/pr/merge.command.js';
import type { ApprovePRCommand } from '../commands/pr/approve.command.js';
import type { DeclinePRCommand } from '../commands/pr/decline.command.js';
import type { ReadyPRCommand } from '../commands/pr/ready.command.js';
import type { CheckoutPRCommand } from '../commands/pr/checkout.command.js';
import type { DiffPRCommand } from '../commands/pr/diff.command.js';
import type { ActivityPRCommand } from '../commands/pr/activity.command.js';
import type { CommentPRCommand } from '../commands/pr/comment.command.js';
import type { ListCommentsPRCommand } from '../commands/pr/comments.list.command.js';
import type { EditCommentPRCommand } from '../commands/pr/comments.edit.command.js';
import type { DeleteCommentPRCommand } from '../commands/pr/comments.delete.command.js';
import type { ResolveCommentPRCommand } from '../commands/pr/comments.resolve.command.js';
import type { UnresolveCommentPRCommand } from '../commands/pr/comments.unresolve.command.js';
import type { ViewCommentPRCommand } from '../commands/pr/comments.view.command.js';
import type { ReplyCommentPRCommand } from '../commands/pr/comments.reply.command.js';
import type { AddReviewerPRCommand } from '../commands/pr/reviewers.add.command.js';
import type { RemoveReviewerPRCommand } from '../commands/pr/reviewers.remove.command.js';
import type { ListReviewersPRCommand } from '../commands/pr/reviewers.list.command.js';
import type { ChecksPRCommand } from '../commands/pr/checks.command.js';
import type { ListSnippetsCommand } from '../commands/snippet/list.command.js';
import type { ViewSnippetCommand } from '../commands/snippet/view.command.js';
import type { CreateSnippetCommand } from '../commands/snippet/create.command.js';
import type { EditSnippetCommand } from '../commands/snippet/edit.command.js';
import type { DeleteSnippetCommand } from '../commands/snippet/delete.command.js';
import type { WatchSnippetCommand } from '../commands/snippet/watch.command.js';
import type { UnwatchSnippetCommand } from '../commands/snippet/unwatch.command.js';
import type { ListSnippetCommentsCommand } from '../commands/snippet/comments.list.command.js';
import type { AddSnippetCommentCommand } from '../commands/snippet/comments.add.command.js';
import type { EditSnippetCommentCommand } from '../commands/snippet/comments.edit.command.js';
import type { DeleteSnippetCommentCommand } from '../commands/snippet/comments.delete.command.js';
import type { ListPipelinesCommand } from '../commands/pipeline/list.command.js';
import type { ViewPipelineCommand } from '../commands/pipeline/view.command.js';
import type { RunPipelineCommand } from '../commands/pipeline/run.command.js';
import type { StopPipelineCommand } from '../commands/pipeline/stop.command.js';
import type { LogsPipelineCommand } from '../commands/pipeline/logs.command.js';
import type { ListCommitsCommand } from '../commands/commit/list.command.js';
import type { ViewCommitCommand } from '../commands/commit/view.command.js';
import type { ListCommitStatusesCommand } from '../commands/status/list.command.js';
import type { SetCommitStatusCommand } from '../commands/status/set.command.js';
import type { ListWorkspacesCommand } from '../commands/workspace/list.command.js';
import type { ViewWorkspaceCommand } from '../commands/workspace/view.command.js';
import type { ListProjectsCommand } from '../commands/project/list.command.js';
import type { ViewProjectCommand } from '../commands/project/view.command.js';
import type { CreateProjectCommand } from '../commands/project/create.command.js';
import type { SearchCodeCommand } from '../commands/search/code.command.js';
import type { ListWebhooksCommand } from '../commands/webhook/list.command.js';
import type { ViewWebhookCommand } from '../commands/webhook/view.command.js';
import type { CreateWebhookCommand } from '../commands/webhook/create.command.js';
import type { DeleteWebhookCommand } from '../commands/webhook/delete.command.js';
import type { ListBranchRestrictionsCommand } from '../commands/branch-restriction/list.command.js';
import type { ViewBranchRestrictionCommand } from '../commands/branch-restriction/view.command.js';
import type { CreateBranchRestrictionCommand } from '../commands/branch-restriction/create.command.js';
import type { DeleteBranchRestrictionCommand } from '../commands/branch-restriction/delete.command.js';
import type { ListSshKeysCommand } from '../commands/ssh-key/list.command.js';
import type { AddSshKeyCommand } from '../commands/ssh-key/add.command.js';
import type { DeleteSshKeyCommand } from '../commands/ssh-key/delete.command.js';
import type { ListGpgKeysCommand } from '../commands/gpg-key/list.command.js';
import type { AddGpgKeyCommand } from '../commands/gpg-key/add.command.js';
import type { DeleteGpgKeyCommand } from '../commands/gpg-key/delete.command.js';
import type { ListDeploymentsCommand } from '../commands/deployment/list.command.js';
import type { ViewDeploymentCommand } from '../commands/deployment/view.command.js';
import type { ListEnvironmentsCommand } from '../commands/deployment/environments.command.js';
import type { SetAliasCommand } from '../commands/alias/set.command.js';
import type { ListAliasesCommand } from '../commands/alias/list.command.js';
import type { DeleteAliasCommand } from '../commands/alias/delete.command.js';
import type { GetConfigCommand } from '../commands/config/get.command.js';
import type { SetConfigCommand } from '../commands/config/set.command.js';
import type { ListConfigCommand } from '../commands/config/list.command.js';
import type { InstallCompletionCommand } from '../commands/completion/install.command.js';
import type { UninstallCompletionCommand } from '../commands/completion/uninstall.command.js';
import type { PrintCompletionCommand } from '../commands/completion/print.command.js';
import type { BrowseCommand } from '../commands/browse.command.js';
import type { ApiCommand } from '../commands/api.command.js';

/**
 * Service tokens for dependency injection
 */
export const ServiceTokens = {
  // Core services
  ConfigService: token<ConfigService>('ConfigService'),
  CredentialStore: token<ICredentialStore>('CredentialStore'),
  GitService: token<IGitService>('GitService'),
  ContextService: token<IContextService>('ContextService'),
  OutputService: token<IOutputService>('OutputService'),
  PromptService: token<IPromptService>('PromptService'),
  OAuthService: token<OAuthService>('OAuthService'),
  VersionService: token<VersionService>('VersionService'),

  // API Clients
  SharedApiAxios: token<AxiosInstance>('SharedApiAxios'),
  PullrequestsApi: token<PullrequestsApi>('PullrequestsApi'),
  RepositoriesApi: token<RepositoriesApi>('RepositoriesApi'),
  UsersApi: token<UsersApi>('UsersApi'),
  CommitStatusesApi: token<CommitStatusesApi>('CommitStatusesApi'),
  CommitsApi: token<CommitsApi>('CommitsApi'),
  PipelinesApi: token<PipelinesApi>('PipelinesApi'),
  WorkspacesApi: token<WorkspacesApi>('WorkspacesApi'),
  ProjectsApi: token<ProjectsApi>('ProjectsApi'),
  SourceApi: token<SourceApi>('SourceApi'),
  DownloadsApi: token<DownloadsApi>('DownloadsApi'),
  SearchApi: token<SearchApi>('SearchApi'),
  WebhooksApi: token<WebhooksApi>('WebhooksApi'),
  BranchRestrictionsApi: token<BranchRestrictionsApi>('BranchRestrictionsApi'),
  SSHApi: token<SSHApi>('SSHApi'),
  GPGApi: token<GPGApi>('GPGApi'),
  DeploymentsApi: token<DeploymentsApi>('DeploymentsApi'),

  // Commands - Auth
  LoginCommand: token<LoginCommand>('LoginCommand'),
  LogoutCommand: token<LogoutCommand>('LogoutCommand'),
  StatusCommand: token<StatusCommand>('StatusCommand'),
  TokenCommand: token<TokenCommand>('TokenCommand'),
  SwitchCommand: token<SwitchCommand>('SwitchCommand'),

  // Commands - Repo
  CloneCommand: token<CloneCommand>('CloneCommand'),
  CreateRepoCommand: token<CreateRepoCommand>('CreateRepoCommand'),
  ListReposCommand: token<ListReposCommand>('ListReposCommand'),
  ViewRepoCommand: token<ViewRepoCommand>('ViewRepoCommand'),
  DeleteRepoCommand: token<DeleteRepoCommand>('DeleteRepoCommand'),
  ListDefaultReviewersCommand: token<ListDefaultReviewersCommand>(
    'ListDefaultReviewersCommand'
  ),
  AddDefaultReviewerCommand: token<AddDefaultReviewerCommand>(
    'AddDefaultReviewerCommand'
  ),
  RemoveDefaultReviewerCommand: token<RemoveDefaultReviewerCommand>(
    'RemoveDefaultReviewerCommand'
  ),
  CatRepoFileCommand: token<CatRepoFileCommand>('CatRepoFileCommand'),
  ListRepoFilesCommand: token<ListRepoFilesCommand>('ListRepoFilesCommand'),
  ListDownloadsCommand: token<ListDownloadsCommand>('ListDownloadsCommand'),
  UploadDownloadCommand: token<UploadDownloadCommand>('UploadDownloadCommand'),
  DeleteDownloadCommand: token<DeleteDownloadCommand>('DeleteDownloadCommand'),

  // Services - Default Reviewers
  DefaultReviewerService: token<DefaultReviewerService>(
    'DefaultReviewerService'
  ),

  // Services - User reference resolution (@me, IDs, names, emails)
  UserResolverService: token<UserResolverService>('UserResolverService'),

  // Services - URL builder (Bitbucket web URL construction)
  UrlBuilderService: token<IUrlBuilderService>('UrlBuilderService'),

  // Commands - Top level
  BrowseCommand: token<BrowseCommand>('BrowseCommand'),
  ApiCommand: token<ApiCommand>('ApiCommand'),

  // Commands - PR
  CreatePRCommand: token<CreatePRCommand>('CreatePRCommand'),
  ListPRsCommand: token<ListPRsCommand>('ListPRsCommand'),
  ViewPRCommand: token<ViewPRCommand>('ViewPRCommand'),
  EditPRCommand: token<EditPRCommand>('EditPRCommand'),
  MergePRCommand: token<MergePRCommand>('MergePRCommand'),
  ApprovePRCommand: token<ApprovePRCommand>('ApprovePRCommand'),
  DeclinePRCommand: token<DeclinePRCommand>('DeclinePRCommand'),
  ReadyPRCommand: token<ReadyPRCommand>('ReadyPRCommand'),
  CheckoutPRCommand: token<CheckoutPRCommand>('CheckoutPRCommand'),
  DiffPRCommand: token<DiffPRCommand>('DiffPRCommand'),
  ActivityPRCommand: token<ActivityPRCommand>('ActivityPRCommand'),
  ChecksPRCommand: token<ChecksPRCommand>('ChecksPRCommand'),
  CommentPRCommand: token<CommentPRCommand>('CommentPRCommand'),
  ListCommentsPRCommand: token<ListCommentsPRCommand>('ListCommentsPRCommand'),
  EditCommentPRCommand: token<EditCommentPRCommand>('EditCommentPRCommand'),
  DeleteCommentPRCommand: token<DeleteCommentPRCommand>(
    'DeleteCommentPRCommand'
  ),
  ResolveCommentPRCommand: token<ResolveCommentPRCommand>(
    'ResolveCommentPRCommand'
  ),
  UnresolveCommentPRCommand: token<UnresolveCommentPRCommand>(
    'UnresolveCommentPRCommand'
  ),
  ViewCommentPRCommand: token<ViewCommentPRCommand>('ViewCommentPRCommand'),
  ReplyCommentPRCommand: token<ReplyCommentPRCommand>('ReplyCommentPRCommand'),
  AddReviewerPRCommand: token<AddReviewerPRCommand>('AddReviewerPRCommand'),
  RemoveReviewerPRCommand: token<RemoveReviewerPRCommand>(
    'RemoveReviewerPRCommand'
  ),
  ListReviewersPRCommand: token<ListReviewersPRCommand>(
    'ListReviewersPRCommand'
  ),

  // API Clients - Snippets
  SnippetsApi: token<SnippetsApi>('SnippetsApi'),
  SnippetFilesService: token<ISnippetFilesService>('SnippetFilesService'),

  // Commands - Snippet
  ListSnippetsCommand: token<ListSnippetsCommand>('ListSnippetsCommand'),
  ViewSnippetCommand: token<ViewSnippetCommand>('ViewSnippetCommand'),
  CreateSnippetCommand: token<CreateSnippetCommand>('CreateSnippetCommand'),
  EditSnippetCommand: token<EditSnippetCommand>('EditSnippetCommand'),
  DeleteSnippetCommand: token<DeleteSnippetCommand>('DeleteSnippetCommand'),
  WatchSnippetCommand: token<WatchSnippetCommand>('WatchSnippetCommand'),
  UnwatchSnippetCommand: token<UnwatchSnippetCommand>('UnwatchSnippetCommand'),
  ListSnippetCommentsCommand: token<ListSnippetCommentsCommand>(
    'ListSnippetCommentsCommand'
  ),
  AddSnippetCommentCommand: token<AddSnippetCommentCommand>(
    'AddSnippetCommentCommand'
  ),
  EditSnippetCommentCommand: token<EditSnippetCommentCommand>(
    'EditSnippetCommentCommand'
  ),
  DeleteSnippetCommentCommand: token<DeleteSnippetCommentCommand>(
    'DeleteSnippetCommentCommand'
  ),

  // Commands - Pipeline
  ListPipelinesCommand: token<ListPipelinesCommand>('ListPipelinesCommand'),
  ViewPipelineCommand: token<ViewPipelineCommand>('ViewPipelineCommand'),
  RunPipelineCommand: token<RunPipelineCommand>('RunPipelineCommand'),
  StopPipelineCommand: token<StopPipelineCommand>('StopPipelineCommand'),
  LogsPipelineCommand: token<LogsPipelineCommand>('LogsPipelineCommand'),

  // Commands - Commit
  ListCommitsCommand: token<ListCommitsCommand>('ListCommitsCommand'),
  ViewCommitCommand: token<ViewCommitCommand>('ViewCommitCommand'),

  // Commands - Status (commit build statuses)
  ListCommitStatusesCommand: token<ListCommitStatusesCommand>(
    'ListCommitStatusesCommand'
  ),
  SetCommitStatusCommand: token<SetCommitStatusCommand>(
    'SetCommitStatusCommand'
  ),

  // Commands - Workspace
  ListWorkspacesCommand: token<ListWorkspacesCommand>('ListWorkspacesCommand'),
  ViewWorkspaceCommand: token<ViewWorkspaceCommand>('ViewWorkspaceCommand'),

  // Commands - Project
  ListProjectsCommand: token<ListProjectsCommand>('ListProjectsCommand'),
  ViewProjectCommand: token<ViewProjectCommand>('ViewProjectCommand'),
  CreateProjectCommand: token<CreateProjectCommand>('CreateProjectCommand'),

  // Commands - Search
  SearchCodeCommand: token<SearchCodeCommand>('SearchCodeCommand'),

  // Commands - Webhook
  ListWebhooksCommand: token<ListWebhooksCommand>('ListWebhooksCommand'),
  ViewWebhookCommand: token<ViewWebhookCommand>('ViewWebhookCommand'),
  CreateWebhookCommand: token<CreateWebhookCommand>('CreateWebhookCommand'),
  DeleteWebhookCommand: token<DeleteWebhookCommand>('DeleteWebhookCommand'),

  // Commands - Branch restriction
  ListBranchRestrictionsCommand: token<ListBranchRestrictionsCommand>(
    'ListBranchRestrictionsCommand'
  ),
  ViewBranchRestrictionCommand: token<ViewBranchRestrictionCommand>(
    'ViewBranchRestrictionCommand'
  ),
  CreateBranchRestrictionCommand: token<CreateBranchRestrictionCommand>(
    'CreateBranchRestrictionCommand'
  ),
  DeleteBranchRestrictionCommand: token<DeleteBranchRestrictionCommand>(
    'DeleteBranchRestrictionCommand'
  ),

  // Commands - SSH key
  ListSshKeysCommand: token<ListSshKeysCommand>('ListSshKeysCommand'),
  AddSshKeyCommand: token<AddSshKeyCommand>('AddSshKeyCommand'),
  DeleteSshKeyCommand: token<DeleteSshKeyCommand>('DeleteSshKeyCommand'),

  // Commands - GPG key
  ListGpgKeysCommand: token<ListGpgKeysCommand>('ListGpgKeysCommand'),
  AddGpgKeyCommand: token<AddGpgKeyCommand>('AddGpgKeyCommand'),
  DeleteGpgKeyCommand: token<DeleteGpgKeyCommand>('DeleteGpgKeyCommand'),

  // Commands - Deployment
  ListDeploymentsCommand: token<ListDeploymentsCommand>(
    'ListDeploymentsCommand'
  ),
  ViewDeploymentCommand: token<ViewDeploymentCommand>('ViewDeploymentCommand'),
  ListEnvironmentsCommand: token<ListEnvironmentsCommand>(
    'ListEnvironmentsCommand'
  ),

  // Commands - Config
  GetConfigCommand: token<GetConfigCommand>('GetConfigCommand'),
  SetConfigCommand: token<SetConfigCommand>('SetConfigCommand'),
  ListConfigCommand: token<ListConfigCommand>('ListConfigCommand'),

  // Commands - Alias
  SetAliasCommand: token<SetAliasCommand>('SetAliasCommand'),
  ListAliasesCommand: token<ListAliasesCommand>('ListAliasesCommand'),
  DeleteAliasCommand: token<DeleteAliasCommand>('DeleteAliasCommand'),

  // Commands - Completion
  InstallCompletionCommand: token<InstallCompletionCommand>(
    'InstallCompletionCommand'
  ),
  UninstallCompletionCommand: token<UninstallCompletionCommand>(
    'UninstallCompletionCommand'
  ),
  PrintCompletionCommand: token<PrintCompletionCommand>(
    'PrintCompletionCommand'
  ),
};

export type ServiceToken = (typeof ServiceTokens)[keyof typeof ServiceTokens];

/** A token that resolves to a CLI command. */
export type CommandToken = Token<BaseCommand<unknown, unknown>>;

/** The options object the command behind `K` expects. */
export type CommandOptions<K extends CommandToken> =
  TokenType<K> extends BaseCommand<infer TOptions, unknown> ? TOptions : never;
