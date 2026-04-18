# PullrequestsApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getPullrequestsForCommit**](#getpullrequestsforcommit) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit}/pullrequests | List pull requests that contain a commit|
|[**repositoriesWorkspaceRepoSlugDefaultReviewersGet**](#repositoriesworkspacereposlugdefaultreviewersget) | **GET** /repositories/{workspace}/{repo_slug}/default-reviewers | List default reviewers|
|[**repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernameDelete**](#repositoriesworkspacereposlugdefaultreviewerstargetusernamedelete) | **DELETE** /repositories/{workspace}/{repo_slug}/default-reviewers/{target_username} | Remove a user from the default reviewers|
|[**repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernameGet**](#repositoriesworkspacereposlugdefaultreviewerstargetusernameget) | **GET** /repositories/{workspace}/{repo_slug}/default-reviewers/{target_username} | Get a default reviewer|
|[**repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernamePut**](#repositoriesworkspacereposlugdefaultreviewerstargetusernameput) | **PUT** /repositories/{workspace}/{repo_slug}/default-reviewers/{target_username} | Add a user to the default reviewers|
|[**repositoriesWorkspaceRepoSlugEffectiveDefaultReviewersGet**](#repositoriesworkspacereposlugeffectivedefaultreviewersget) | **GET** /repositories/{workspace}/{repo_slug}/effective-default-reviewers | List effective default reviewers|
|[**repositoriesWorkspaceRepoSlugPullrequestsActivityGet**](#repositoriesworkspacereposlugpullrequestsactivityget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/activity | List a pull request activity log|
|[**repositoriesWorkspaceRepoSlugPullrequestsGet**](#repositoriesworkspacereposlugpullrequestsget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests | List pull requests|
|[**repositoriesWorkspaceRepoSlugPullrequestsPost**](#repositoriesworkspacereposlugpullrequestspost) | **POST** /repositories/{workspace}/{repo_slug}/pullrequests | Create a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdActivityGet**](#repositoriesworkspacereposlugpullrequestspullrequestidactivityget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/activity | List a pull request activity log|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApproveDelete**](#repositoriesworkspacereposlugpullrequestspullrequestidapprovedelete) | **DELETE** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve | Unapprove a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApprovePost**](#repositoriesworkspacereposlugpullrequestspullrequestidapprovepost) | **POST** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/approve | Approve a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdDelete**](#repositoriesworkspacereposlugpullrequestspullrequestidcommentscommentiddelete) | **DELETE** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id} | Delete a comment on a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdGet**](#repositoriesworkspacereposlugpullrequestspullrequestidcommentscommentidget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id} | Get a comment on a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdPut**](#repositoriesworkspacereposlugpullrequestspullrequestidcommentscommentidput) | **PUT** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id} | Update a comment on a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolveDelete**](#repositoriesworkspacereposlugpullrequestspullrequestidcommentscommentidresolvedelete) | **DELETE** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}/resolve | Reopen a comment thread|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolvePost**](#repositoriesworkspacereposlugpullrequestspullrequestidcommentscommentidresolvepost) | **POST** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}/resolve | Resolve a comment thread|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsGet**](#repositoriesworkspacereposlugpullrequestspullrequestidcommentsget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments | List comments on a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsPost**](#repositoriesworkspacereposlugpullrequestspullrequestidcommentspost) | **POST** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments | Create a comment on a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommitsGet**](#repositoriesworkspacereposlugpullrequestspullrequestidcommitsget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/commits | List commits on a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDeclinePost**](#repositoriesworkspacereposlugpullrequestspullrequestiddeclinepost) | **POST** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/decline | Decline a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffGet**](#repositoriesworkspacereposlugpullrequestspullrequestiddiffget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/diff | List changes in a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet**](#repositoriesworkspacereposlugpullrequestspullrequestiddiffstatget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/diffstat | Get the diff stat for a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet**](#repositoriesworkspacereposlugpullrequestspullrequestidget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id} | Get a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergePost**](#repositoriesworkspacereposlugpullrequestspullrequestidmergepost) | **POST** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/merge | Merge a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergeTaskStatusTaskIdGet**](#repositoriesworkspacereposlugpullrequestspullrequestidmergetaskstatustaskidget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/merge/task-status/{task_id} | Get the merge task status for a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPatchGet**](#repositoriesworkspacereposlugpullrequestspullrequestidpatchget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/patch | Get the patch for a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut**](#repositoriesworkspacereposlugpullrequestspullrequestidput) | **PUT** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id} | Update a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdRequestChangesDelete**](#repositoriesworkspacereposlugpullrequestspullrequestidrequestchangesdelete) | **DELETE** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/request-changes | Remove change request for a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdRequestChangesPost**](#repositoriesworkspacereposlugpullrequestspullrequestidrequestchangespost) | **POST** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/request-changes | Request changes for a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet**](#repositoriesworkspacereposlugpullrequestspullrequestidstatusesget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/statuses | List commit statuses for a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksGet**](#repositoriesworkspacereposlugpullrequestspullrequestidtasksget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/tasks | List tasks on a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksPost**](#repositoriesworkspacereposlugpullrequestspullrequestidtaskspost) | **POST** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/tasks | Create a task on a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdDelete**](#repositoriesworkspacereposlugpullrequestspullrequestidtaskstaskiddelete) | **DELETE** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/tasks/{task_id} | Delete a task on a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdGet**](#repositoriesworkspacereposlugpullrequestspullrequestidtaskstaskidget) | **GET** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/tasks/{task_id} | Get a task on a pull request|
|[**repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdPut**](#repositoriesworkspacereposlugpullrequestspullrequestidtaskstaskidput) | **PUT** /repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/tasks/{task_id} | Update a task on a pull request|
|[**workspacesWorkspacePullrequestsSelectedUserGet**](#workspacesworkspacepullrequestsselecteduserget) | **GET** /workspaces/{workspace}/pullrequests/{selected_user} | List workspace pull requests for a user|

# **getPullrequestsForCommit**
> PaginatedPullrequests getPullrequestsForCommit()

Returns a paginated list of all pull requests as part of which this commit was reviewed. Pull Request Commit Links app must be installed first before using this API; installation automatically occurs when \'Go to pull request\' is clicked from the web interface for a commit\'s details.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces (default to undefined)
let repoSlug: string; //The repository; either the UUID in curly braces, or the slug (default to undefined)
let commit: string; //The SHA1 of the commit (default to undefined)
let page: number; //Which page to retrieve (optional) (default to 1)
let pagelen: number; //How many pull requests to retrieve per page (optional) (default to 30)

const { status, data } = await apiInstance.getPullrequestsForCommit(
    workspace,
    repoSlug,
    commit,
    page,
    pagelen
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces | defaults to undefined|
| **repoSlug** | [**string**] | The repository; either the UUID in curly braces, or the slug | defaults to undefined|
| **commit** | [**string**] | The SHA1 of the commit | defaults to undefined|
| **page** | [**number**] | Which page to retrieve | (optional) defaults to 1|
| **pagelen** | [**number**] | How many pull requests to retrieve per page | (optional) defaults to 30|


### Return type

**PaginatedPullrequests**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The paginated list of pull requests. |  -  |
|**202** | The repository\&#39;s pull requests are still being indexed. |  -  |
|**404** | Either the repository does not exist, or pull request commit links have not yet been indexed. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDefaultReviewersGet**
> PaginatedAccounts repositoriesWorkspaceRepoSlugDefaultReviewersGet()

Returns the repository\'s default reviewers.  These are the users that are automatically added as reviewers on every new pull request that is created. To obtain the repository\'s default reviewers as well as the default reviewers inherited from the project, use the [effective-default-reveiwers](#api-repositories-workspace-repo-slug-effective-default-reviewers-get) endpoint.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDefaultReviewersGet(
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedAccounts**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The paginated list of default reviewers |  -  |
|**403** | If the authenticated user does not have access to view the default reviewers |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernameDelete**
> repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernameDelete()

Removes a default reviewer from the repository.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let targetUsername: string; //This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernameDelete(
    repoSlug,
    targetUsername,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **targetUsername** | [**string**] | This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | The specified user successfully removed from the default reviewers |  -  |
|**403** | If the authenticated user does not have access modify the default reviewers |  -  |
|**404** | If the specified user does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernameGet**
> Account repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernameGet()

Returns the specified reviewer.  This can be used to test whether a user is among the repository\'s default reviewers list. A 404 indicates that that specified user is not a default reviewer.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let targetUsername: string; //This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernameGet(
    repoSlug,
    targetUsername,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **targetUsername** | [**string**] | This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Account**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The specified user is a default reviewer |  -  |
|**403** | If the authenticated user does not have access to check if the specified user is a default reviewer |  -  |
|**404** | If the specified user does not exist or is not a default reviewer |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernamePut**
> Account repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernamePut()

Adds the specified user to the repository\'s list of default reviewers.  This method is idempotent. Adding a user a second time has no effect.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let targetUsername: string; //This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: `{account UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDefaultReviewersTargetUsernamePut(
    repoSlug,
    targetUsername,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **targetUsername** | [**string**] | This can either be the username or the UUID of the default reviewer, surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Account**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The specified user was successfully added to the default reviewers |  -  |
|**400** | If the authenticated user tried to add a team, bot user, or user without access to the repository to the default reviewers |  -  |
|**403** | If the authenticated user does not have permission to modify the default reviewers |  -  |
|**404** | If the specified user does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugEffectiveDefaultReviewersGet**
> PaginatedDefaultReviewerAndType repositoriesWorkspaceRepoSlugEffectiveDefaultReviewersGet()

Returns the repository\'s effective default reviewers. This includes both default reviewers defined at the repository level as well as those inherited from its project.  These are the users that are automatically added as reviewers on every new pull request that is created.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugEffectiveDefaultReviewersGet(
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedDefaultReviewerAndType**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The paginated list of effective default reviewers |  -  |
|**403** | If the authenticated user does not have access to view the default reviewers |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsActivityGet**
> repositoriesWorkspaceRepoSlugPullrequestsActivityGet()

Returns a paginated list of the pull request\'s activity log.  This handler serves both a v20 and internal endpoint. The v20 endpoint returns reviewer comments, updates, approvals and request changes. The internal endpoint includes those plus tasks and attachments.  Comments created on a file or a line of code have an inline property.  Comment example: ``` {     \"pagelen\": 20,     \"values\": [         {             \"comment\": {                 \"links\": {                     \"self\": {                         \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695/comments/118571088\"                     },                     \"html\": {                         \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695/_/diff#comment-118571088\"                     }                 },                 \"deleted\": false,                 \"pullrequest\": {                     \"type\": \"pullrequest\",                     \"id\": 5695,                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695\"                         }                     },                     \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\"                 },                 \"content\": {                     \"raw\": \"inline with to a dn from lines\",                     \"markup\": \"markdown\",                     \"html\": \"<p>inline with to a dn from lines</p>\",                     \"type\": \"rendered\"                 },                 \"created_on\": \"2019-09-27T00:33:46.039178+00:00\",                 \"user\": {                     \"display_name\": \"Name Lastname\",                     \"uuid\": \"{}\",                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/users/%7B%7D\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/%7B%7D/\"                         },                         \"avatar\": {                             \"href\": \"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/:/128\"                         }                     },                     \"type\": \"user\",                     \"nickname\": \"Name\",                     \"account_id\": \"\"                 },                 \"created_on\": \"2019-09-27T00:33:46.039178+00:00\",                 \"user\": {                     \"display_name\": \"Name Lastname\",                     \"uuid\": \"{}\",                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/users/%7B%7D\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/%7B%7D/\"                         },                         \"avatar\": {                             \"href\": \"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/:/128\"                         }                     },                     \"type\": \"user\",                     \"nickname\": \"Name\",                     \"account_id\": \"\"                 },                 \"updated_on\": \"2019-09-27T00:33:46.055384+00:00\",                 \"inline\": {                     \"context_lines\": \"\",                     \"to\": null,                     \"path\": \"\",                     \"outdated\": false,                     \"from\": 211                 },                 \"type\": \"pullrequest_comment\",                 \"id\": 118571088             },             \"pull_request\": {                 \"type\": \"pullrequest\",                 \"id\": 5695,                 \"links\": {                     \"self\": {                         \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695\"                     },                     \"html\": {                         \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695\"                     }                 },                 \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\"             }         }     ] } ```  Updates include a state property of OPEN, MERGED, or DECLINED.  Update example: ``` {     \"pagelen\": 20,     \"values\": [         {             \"update\": {                 \"description\": \"\",                 \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\",                 \"destination\": {                     \"commit\": {                         \"type\": \"commit\",                         \"hash\": \"6a2c16e4a152\",                         \"links\": {                             \"self\": {                                 \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/commit/6a2c16e4a152\"                             },                             \"html\": {                                 \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/commits/6a2c16e4a152\"                             }                         }                     },                     \"branch\": {                         \"name\": \"master\"                     },                     \"repository\": {                         \"name\": \"Atlaskit-MK-2\",                         \"type\": \"repository\",                         \"full_name\": \"atlassian/atlaskit-mk-2\",                         \"links\": {                             \"self\": {                                 \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2\"                             },                             \"html\": {                                 \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2\"                             },                             \"avatar\": {                                 \"href\": \"https://bytebucket.org/ravatar/%7B%7D?ts=js\"                             }                         },                         \"uuid\": \"{}\"                     }                 },                 \"reason\": \"\",                 \"source\": {                     \"commit\": {                         \"type\": \"commit\",                         \"hash\": \"728c8bad1813\",                         \"links\": {                             \"self\": {                                 \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/commit/728c8bad1813\"                             },                             \"html\": {                                 \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/commits/728c8bad1813\"                             }                         }                     },                     \"branch\": {                         \"name\": \"username/NONE-add-onClick-prop-for-accessibility\"                     },                     \"repository\": {                         \"name\": \"Atlaskit-MK-2\",                         \"type\": \"repository\",                         \"full_name\": \"atlassian/atlaskit-mk-2\",                         \"links\": {                             \"self\": {                                 \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2\"                             },                             \"html\": {                                 \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2\"                             },                             \"avatar\": {                                 \"href\": \"https://bytebucket.org/ravatar/%7B%7D?ts=js\"                             }                         },                         \"uuid\": \"{}\"                     }                 },                 \"state\": \"OPEN\",                 \"author\": {                     \"display_name\": \"Name Lastname\",                     \"uuid\": \"{}\",                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/users/%7B%7D\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/%7B%7D/\"                         },                         \"avatar\": {                             \"href\": \"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/:/128\"                         }                     },                     \"type\": \"user\",                     \"nickname\": \"Name\",                     \"account_id\": \"\"                 },                 \"date\": \"2019-05-10T06:48:25.305565+00:00\"             },             \"pull_request\": {                 \"type\": \"pullrequest\",                 \"id\": 5695,                 \"links\": {                     \"self\": {                         \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695\"                     },                     \"html\": {                         \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695\"                     }                 },                 \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\"             }         }     ] } ```  Approval example: ``` {     \"pagelen\": 20,     \"values\": [         {             \"approval\": {                 \"date\": \"2019-09-27T00:37:19.849534+00:00\",                 \"pullrequest\": {                     \"type\": \"pullrequest\",                     \"id\": 5695,                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695\"                         }                     },                     \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\"                 },                 \"user\": {                     \"display_name\": \"Name Lastname\",                     \"uuid\": \"{}\",                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/users/%7B%7D\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/%7B%7D/\"                         },                         \"avatar\": {                             \"href\": \"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/:/128\"                         }                     },                     \"type\": \"user\",                     \"nickname\": \"Name\",                     \"account_id\": \"\"                 }             },             \"pull_request\": {                 \"type\": \"pullrequest\",                 \"id\": 5695,                 \"links\": {                     \"self\": {                         \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695\"                     },                     \"html\": {                         \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695\"                     }                 },                 \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\"             }         }     ] } ```

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsActivityGet(
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The pull request activity log |  -  |
|**401** | If the repository is private and the request was not authenticated. |  -  |
|**404** | If the specified repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsGet**
> PaginatedPullrequests repositoriesWorkspaceRepoSlugPullrequestsGet()

Returns all pull requests on the specified repository.  By default only open pull requests are returned. This can be controlled using the `state` query parameter. To retrieve pull requests that are in one of multiple states, repeat the `state` parameter for each individual state.  This endpoint also supports filtering and sorting of the results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for more details.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED'; //Only return pull requests that are in this state. This parameter can be repeated. (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsGet(
    repoSlug,
    workspace,
    state
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **state** | [**&#39;OPEN&#39; | &#39;MERGED&#39; | &#39;DECLINED&#39; | &#39;SUPERSEDED&#39;**]**Array<&#39;OPEN&#39; &#124; &#39;MERGED&#39; &#124; &#39;DECLINED&#39; &#124; &#39;SUPERSEDED&#39;>** | Only return pull requests that are in this state. This parameter can be repeated. | (optional) defaults to undefined|


### Return type

**PaginatedPullrequests**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | All pull requests on the specified repository. |  -  |
|**401** | If the repository is private and the request was not authenticated. |  -  |
|**404** | If the specified repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPost**
> Pullrequest repositoriesWorkspaceRepoSlugPullrequestsPost()

Creates a new pull request where the destination repository is this repository and the author is the authenticated user.  The minimum required fields to create a pull request are `title` and `source`, specified by a branch name.  ``` curl https://api.bitbucket.org/2.0/repositories/my-workspace/my-repository/pullrequests \\     -u my-username:my-password \\     --request POST \\     --header \'Content-Type: application/json\' \\     --data \'{         \"title\": \"My Title\",         \"source\": {             \"branch\": {                 \"name\": \"staging\"             }         }     }\' ```  If the pull request\'s `destination` is not specified, it will default to the `repository.mainbranch`. To open a pull request to a different branch, say from a feature branch to a staging branch, specify a `destination` (same format as the `source`):  ``` {     \"title\": \"My Title\",     \"source\": {         \"branch\": {             \"name\": \"my-feature-branch\"         }     },     \"destination\": {         \"branch\": {             \"name\": \"staging\"         }     } } ```  Reviewers can be specified by adding an array of user objects as the `reviewers` property.  ``` {     \"title\": \"My Title\",     \"source\": {         \"branch\": {             \"name\": \"my-feature-branch\"         }     },     \"reviewers\": [         {             \"uuid\": \"{504c3b62-8120-4f0c-a7bc-87800b9d6f70}\"         }     ] } ```  Other fields:  * `description` - a string * `close_source_branch` - boolean that specifies if the source branch should be closed upon merging * `draft` - boolean that specifies whether the pull request is a draft

### Example

```typescript
import {
    PullrequestsApi,
    Configuration,
    Pullrequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let pullrequest: Pullrequest; //The new pull request.  The request URL you POST to becomes the destination repository URL. For this reason, you must specify an explicit source repository in the request object if you want to pull from a different repository (fork).  Since not all elements are required or even mutable, you only need to include the elements you want to initialize, such as the source branch and the title. (optional)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPost(
    repoSlug,
    workspace,
    pullrequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullrequest** | **Pullrequest**| The new pull request.  The request URL you POST to becomes the destination repository URL. For this reason, you must specify an explicit source repository in the request object if you want to pull from a different repository (fork).  Since not all elements are required or even mutable, you only need to include the elements you want to initialize, such as the source branch and the title. | |
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Pullrequest**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created pull request. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**400** | If the input document was invalid, or if the caller lacks the privilege to create repositories under the targeted account. |  -  |
|**401** | If the request was not authenticated. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdActivityGet**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdActivityGet()

Returns a paginated list of the pull request\'s activity log.  This handler serves both a v20 and internal endpoint. The v20 endpoint returns reviewer comments, updates, approvals and request changes. The internal endpoint includes those plus tasks and attachments.  Comments created on a file or a line of code have an inline property.  Comment example: ``` {     \"pagelen\": 20,     \"values\": [         {             \"comment\": {                 \"links\": {                     \"self\": {                         \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695/comments/118571088\"                     },                     \"html\": {                         \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695/_/diff#comment-118571088\"                     }                 },                 \"deleted\": false,                 \"pullrequest\": {                     \"type\": \"pullrequest\",                     \"id\": 5695,                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695\"                         }                     },                     \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\"                 },                 \"content\": {                     \"raw\": \"inline with to a dn from lines\",                     \"markup\": \"markdown\",                     \"html\": \"<p>inline with to a dn from lines</p>\",                     \"type\": \"rendered\"                 },                 \"created_on\": \"2019-09-27T00:33:46.039178+00:00\",                 \"user\": {                     \"display_name\": \"Name Lastname\",                     \"uuid\": \"{}\",                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/users/%7B%7D\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/%7B%7D/\"                         },                         \"avatar\": {                             \"href\": \"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/:/128\"                         }                     },                     \"type\": \"user\",                     \"nickname\": \"Name\",                     \"account_id\": \"\"                 },                 \"created_on\": \"2019-09-27T00:33:46.039178+00:00\",                 \"user\": {                     \"display_name\": \"Name Lastname\",                     \"uuid\": \"{}\",                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/users/%7B%7D\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/%7B%7D/\"                         },                         \"avatar\": {                             \"href\": \"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/:/128\"                         }                     },                     \"type\": \"user\",                     \"nickname\": \"Name\",                     \"account_id\": \"\"                 },                 \"updated_on\": \"2019-09-27T00:33:46.055384+00:00\",                 \"inline\": {                     \"context_lines\": \"\",                     \"to\": null,                     \"path\": \"\",                     \"outdated\": false,                     \"from\": 211                 },                 \"type\": \"pullrequest_comment\",                 \"id\": 118571088             },             \"pull_request\": {                 \"type\": \"pullrequest\",                 \"id\": 5695,                 \"links\": {                     \"self\": {                         \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695\"                     },                     \"html\": {                         \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695\"                     }                 },                 \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\"             }         }     ] } ```  Updates include a state property of OPEN, MERGED, or DECLINED.  Update example: ``` {     \"pagelen\": 20,     \"values\": [         {             \"update\": {                 \"description\": \"\",                 \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\",                 \"destination\": {                     \"commit\": {                         \"type\": \"commit\",                         \"hash\": \"6a2c16e4a152\",                         \"links\": {                             \"self\": {                                 \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/commit/6a2c16e4a152\"                             },                             \"html\": {                                 \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/commits/6a2c16e4a152\"                             }                         }                     },                     \"branch\": {                         \"name\": \"master\"                     },                     \"repository\": {                         \"name\": \"Atlaskit-MK-2\",                         \"type\": \"repository\",                         \"full_name\": \"atlassian/atlaskit-mk-2\",                         \"links\": {                             \"self\": {                                 \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2\"                             },                             \"html\": {                                 \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2\"                             },                             \"avatar\": {                                 \"href\": \"https://bytebucket.org/ravatar/%7B%7D?ts=js\"                             }                         },                         \"uuid\": \"{}\"                     }                 },                 \"reason\": \"\",                 \"source\": {                     \"commit\": {                         \"type\": \"commit\",                         \"hash\": \"728c8bad1813\",                         \"links\": {                             \"self\": {                                 \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/commit/728c8bad1813\"                             },                             \"html\": {                                 \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/commits/728c8bad1813\"                             }                         }                     },                     \"branch\": {                         \"name\": \"username/NONE-add-onClick-prop-for-accessibility\"                     },                     \"repository\": {                         \"name\": \"Atlaskit-MK-2\",                         \"type\": \"repository\",                         \"full_name\": \"atlassian/atlaskit-mk-2\",                         \"links\": {                             \"self\": {                                 \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2\"                             },                             \"html\": {                                 \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2\"                             },                             \"avatar\": {                                 \"href\": \"https://bytebucket.org/ravatar/%7B%7D?ts=js\"                             }                         },                         \"uuid\": \"{}\"                     }                 },                 \"state\": \"OPEN\",                 \"author\": {                     \"display_name\": \"Name Lastname\",                     \"uuid\": \"{}\",                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/users/%7B%7D\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/%7B%7D/\"                         },                         \"avatar\": {                             \"href\": \"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/:/128\"                         }                     },                     \"type\": \"user\",                     \"nickname\": \"Name\",                     \"account_id\": \"\"                 },                 \"date\": \"2019-05-10T06:48:25.305565+00:00\"             },             \"pull_request\": {                 \"type\": \"pullrequest\",                 \"id\": 5695,                 \"links\": {                     \"self\": {                         \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695\"                     },                     \"html\": {                         \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695\"                     }                 },                 \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\"             }         }     ] } ```  Approval example: ``` {     \"pagelen\": 20,     \"values\": [         {             \"approval\": {                 \"date\": \"2019-09-27T00:37:19.849534+00:00\",                 \"pullrequest\": {                     \"type\": \"pullrequest\",                     \"id\": 5695,                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695\"                         }                     },                     \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\"                 },                 \"user\": {                     \"display_name\": \"Name Lastname\",                     \"uuid\": \"{}\",                     \"links\": {                         \"self\": {                             \"href\": \"https://api.bitbucket.org/2.0/users/%7B%7D\"                         },                         \"html\": {                             \"href\": \"https://bitbucket.org/%7B%7D/\"                         },                         \"avatar\": {                             \"href\": \"https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/:/128\"                         }                     },                     \"type\": \"user\",                     \"nickname\": \"Name\",                     \"account_id\": \"\"                 }             },             \"pull_request\": {                 \"type\": \"pullrequest\",                 \"id\": 5695,                 \"links\": {                     \"self\": {                         \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/atlaskit-mk-2/pullrequests/5695\"                     },                     \"html\": {                         \"href\": \"https://bitbucket.org/atlassian/atlaskit-mk-2/pull-requests/5695\"                     }                 },                 \"title\": \"username/NONE: small change from onFocus to onClick to handle tabbing through the page and not expand the editor unless a click event triggers it\"             }         }     ] } ```

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdActivityGet(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The pull request activity log |  -  |
|**401** | If the repository is private and the request was not authenticated. |  -  |
|**404** | If the specified repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApproveDelete**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApproveDelete()

Redact the authenticated user\'s approval of the specified pull request.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApproveDelete(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | An empty response indicating the authenticated user\&#39;s approval has been withdrawn. |  -  |
|**400** | Pull request cannot be unapproved because the pull request has already been merged. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |
|**404** | The specified pull request or the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApprovePost**
> Participant repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApprovePost()

Approve the specified pull request as the authenticated user.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdApprovePost(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Participant**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The &#x60;participant&#x60; object recording that the authenticated user approved the pull request. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |
|**404** | The specified pull request or the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdDelete**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdDelete()

Deletes a specific pull request comment.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdDelete(
    commentId,
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Successful deletion. |  -  |
|**403** | If the authenticated user does not have access to delete the comment. |  -  |
|**404** | If the comment does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdGet**
> PullrequestComment repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdGet()

Returns a specific pull request comment.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdGet(
    commentId,
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PullrequestComment**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The comment. |  -  |
|**403** | If the authenticated user does not have access to the pull request. |  -  |
|**404** | If the comment does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdPut**
> PullrequestComment repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdPut(pullrequestComment)

Updates a specific pull request comment.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration,
    PullrequestComment
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let pullrequestComment: PullrequestComment; //The contents of the updated comment.

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdPut(
    commentId,
    pullRequestId,
    repoSlug,
    workspace,
    pullrequestComment
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullrequestComment** | **PullrequestComment**| The contents of the updated comment. | |
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PullrequestComment**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The updated comment. |  -  |
|**403** | If the authenticated user does not have access to the comment. |  -  |
|**404** | If the comment does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolveDelete**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolveDelete()



### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolveDelete(
    commentId,
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | The comment is reopened. |  -  |
|**403** | If the authenticated user does not have access to the pull request, or if the provided comment is not a top-level comment. |  -  |
|**404** | If the comment does not exist, or if the comment has not been resolved |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolvePost**
> CommentResolution repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolvePost()



### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsCommentIdResolvePost(
    commentId,
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**CommentResolution**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The comment resolution details. |  -  |
|**403** | If the authenticated user does not have access to the pull request, if the provided comment is not a top-level comment, or if the comment is not on the diff. |  -  |
|**404** | If the comment does not exist. |  -  |
|**409** | If the comment has already been resolved. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsGet**
> PaginatedPullrequestComments repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsGet()

Returns a paginated list of the pull request\'s comments.  This includes both global, inline comments and replies.  The default sorting is oldest to newest and can be overridden with the `sort` query parameter.  This endpoint also supports filtering and sorting of the results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for more details.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsGet(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedPullrequestComments**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of comments made on the given pull request, in chronological order. |  -  |
|**403** | If the authenticated user does not have access to the pull request. |  -  |
|**404** | If the pull request does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsPost**
> PullrequestComment repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsPost(pullrequestComment)

Creates a new pull request comment.  Returns the newly created pull request comment.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration,
    PullrequestComment
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let pullrequestComment: PullrequestComment; //The comment object.

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommentsPost(
    pullRequestId,
    repoSlug,
    workspace,
    pullrequestComment
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullrequestComment** | **PullrequestComment**| The comment object. | |
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PullrequestComment**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created comment. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**403** | If the authenticated user does not have access to the pull request. |  -  |
|**404** | If the pull request does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommitsGet**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommitsGet()

Returns a paginated list of the pull request\'s commits.  These are the commits that are being merged into the destination branch when the pull requests gets accepted.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdCommitsGet(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of commits made on the given pull request, in chronological order. This list will be empty if the source branch no longer exists. |  -  |
|**403** | If the authenticated user does not have access to the pull request. |  -  |
|**404** | If the pull request does not exist or the source branch is from a forked repository which no longer exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDeclinePost**
> Pullrequest repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDeclinePost()

Declines the pull request.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDeclinePost(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Pullrequest**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The pull request was successfully declined. |  -  |
|**555** | If the decline took too long and timed out. In this case the caller should retry the request later. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffGet**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffGet()

Redirects to the [repository diff](/cloud/bitbucket/rest/api-group-commits/#api-repositories-workspace-repo-slug-diff-spec-get) with the revspec that corresponds to the pull request.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffGet(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**302** | Redirects to the [repository diff](/cloud/bitbucket/rest/api-group-commits/#api-repositories-workspace-repo-slug-diff-spec-get) with the revspec that corresponds to the pull request.  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet()

Redirects to the [repository diffstat](/cloud/bitbucket/rest/api-group-commits/#api-repositories-workspace-repo-slug-diffstat-spec-get) with the revspec that corresponds to the pull request.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdDiffstatGet(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**302** | Redirects to the [repository diffstat](/cloud/bitbucket/rest/api-group-commits/#api-repositories-workspace-repo-slug-diffstat-spec-get) with the revspec that corresponds to pull request.  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet**
> Pullrequest repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet()

Returns the specified pull request.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdGet(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Pullrequest**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The pull request object |  -  |
|**401** | If the repository is private and the request was not authenticated. |  -  |
|**404** | If the repository or pull request does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergePost**
> Pullrequest repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergePost()

Merges the pull request.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration,
    PullrequestMergeParameters
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let async: boolean; //Default value is false.   When set to true, runs merge asynchronously and immediately returns a 202 with polling link to the task-status API in the Location header.   When set to false, runs merge and waits for it to complete, returning 200 when it succeeds. If the duration of the merge exceeds a timeout threshold, the API returns a 202 with polling link to the task-status API in the Location header. (optional) (default to undefined)
let pullrequestMergeParameters: PullrequestMergeParameters; // (optional)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergePost(
    pullRequestId,
    repoSlug,
    workspace,
    async,
    pullrequestMergeParameters
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullrequestMergeParameters** | **PullrequestMergeParameters**|  | |
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **async** | [**boolean**] | Default value is false.   When set to true, runs merge asynchronously and immediately returns a 202 with polling link to the task-status API in the Location header.   When set to false, runs merge and waits for it to complete, returning 200 when it succeeds. If the duration of the merge exceeds a timeout threshold, the API returns a 202 with polling link to the task-status API in the Location header. | (optional) defaults to undefined|


### Return type

**Pullrequest**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The pull request object. |  -  |
|**202** | In the Location header, the URL to poll for the pull request merge status |  -  |
|**409** | Unable to merge because one of the refs involved changed while attempting to merge |  -  |
|**555** | If the merge took too long and timed out. In this case the caller should retry the request later |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergeTaskStatusTaskIdGet**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergeTaskStatusTaskIdGet()

When merging a pull request takes too long, the client receives a task ID along with a 202 status code. The task ID can be used in a call to this endpoint to check the status of a merge task.  ``` curl -X GET https://api.bitbucket.org/2.0/repositories/atlassian/bitbucket/pullrequests/2286/merge/task-status/<task_id> ```  If the merge task is not yet finished, a PENDING status will be returned.  ``` HTTP/2 200 {     \"task_status\": \"PENDING\",     \"links\": {         \"self\": {             \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bitbucket/pullrequests/2286/merge/task-status/<task_id>\"         }     } } ```  If the merge was successful, a SUCCESS status will be returned.  ``` HTTP/2 200 {     \"task_status\": \"SUCCESS\",     \"links\": {         \"self\": {             \"href\": \"https://api.bitbucket.org/2.0/repositories/atlassian/bitbucket/pullrequests/2286/merge/task-status/<task_id>\"         }     },     \"merge_result\": <the merged pull request object> } ```  If the merge task failed, an error will be returned.  ``` {     \"type\": \"error\",     \"error\": {         \"message\": \"<error message>\"     } } ```

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let taskId: string; //ID of the merge task (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdMergeTaskStatusTaskIdGet(
    pullRequestId,
    repoSlug,
    taskId,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **taskId** | [**string**] | ID of the merge task | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Returns a task status if the merge is either pending or successful, and if it is successful, a pull request |  -  |
|**400** | If the provided task ID does not relate to this pull request, or if something went wrong during the merge operation |  -  |
|**403** | The user making the request does not have permission to the repo and is different from the user who queued the task |  -  |
|**409** | Unable to merge because one of the refs involved changed while attempting to merge |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPatchGet**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPatchGet()

Redirects to the [repository patch](/cloud/bitbucket/rest/api-group-commits/#api-repositories-workspace-repo-slug-patch-spec-get) with the revspec that corresponds to pull request.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPatchGet(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**302** | Redirects to the [repository patch](/cloud/bitbucket/rest/api-group-commits/#api-repositories-workspace-repo-slug-patch-spec-get) with the revspec that corresponds to pull request.  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut**
> Pullrequest repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut()

Mutates the specified pull request.  This can be used to change the pull request\'s branches or description.  Only open pull requests can be mutated.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration,
    Pullrequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let pullrequest: Pullrequest; //The pull request that is to be updated. (optional)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdPut(
    pullRequestId,
    repoSlug,
    workspace,
    pullrequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullrequest** | **Pullrequest**| The pull request that is to be updated. | |
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Pullrequest**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The updated pull request |  -  |
|**400** | If the input document was invalid. |  -  |
|**401** | If the request was not authenticated. |  -  |
|**404** | If the repository or pull request id does not exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdRequestChangesDelete**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdRequestChangesDelete()



### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdRequestChangesDelete(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | An empty response indicating the authenticated user\&#39;s request for change has been withdrawn. |  -  |
|**400** | Pull request requested changes cannot be removed because the pull request has already been merged. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |
|**404** | The specified pull request or the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdRequestChangesPost**
> Participant repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdRequestChangesPost()



### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdRequestChangesPost(
    pullRequestId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Participant**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The &#x60;participant&#x60; object recording that the authenticated user requested changes on the pull request. |  -  |
|**400** | Pull request changes cannot be requested because the pull request has already been merged. |  -  |
|**401** | The request wasn\&#39;t authenticated. |  -  |
|**404** | The specified pull request or the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet**
> PaginatedCommitstatuses repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet()

Returns all statuses (e.g. build results) for the given pull request.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let q: string; //Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  (optional) (default to undefined)
let sort: string; //Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). Defaults to `created_on`.  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdStatusesGet(
    pullRequestId,
    repoSlug,
    workspace,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **q** | [**string**] | Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  | (optional) defaults to undefined|
| **sort** | [**string**] | Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). Defaults to &#x60;created_on&#x60;.  | (optional) defaults to undefined|


### Return type

**PaginatedCommitstatuses**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of all commit statuses for this pull request. |  -  |
|**401** | If the repository is private and the request was not authenticated. |  -  |
|**404** | If the specified repository or pull request does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksGet**
> PaginatedTasks repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksGet()

Returns a paginated list of the pull request\'s tasks.  This endpoint supports filtering and sorting of the results by the \'task\' field. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for more details.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let q: string; // Query string to narrow down the response. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for details. (optional) (default to undefined)
let sort: string; // Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). Defaults to `created_on`.  (optional) (default to undefined)
let pagelen: number; // Current number of objects on the existing page. The default value is 10 with 100 being the maximum allowed value. Individual APIs may enforce different values.  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksGet(
    pullRequestId,
    repoSlug,
    workspace,
    q,
    sort,
    pagelen
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **q** | [**string**] |  Query string to narrow down the response. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for details. | (optional) defaults to undefined|
| **sort** | [**string**] |  Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). Defaults to &#x60;created_on&#x60;.  | (optional) defaults to undefined|
| **pagelen** | [**number**] |  Current number of objects on the existing page. The default value is 10 with 100 being the maximum allowed value. Individual APIs may enforce different values.  | (optional) defaults to undefined|


### Return type

**PaginatedTasks**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of pull request tasks for the given pull request. |  -  |
|**400** | If the user provides an invalid filter, sort, or fields query parameter. |  -  |
|**403** | If the authenticated user does not have access to the pull request. |  -  |
|**404** | If the pull request does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksPost**
> PullrequestCommentTask repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksPost(pullrequestTaskCreate)

Creates a new pull request task.  Returns the newly created pull request task.  Tasks can optionally be created in relation to a comment specified by the comment\'s ID which will cause the task to appear below the comment on a pull request when viewed in Bitbucket.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration,
    PullrequestTaskCreate
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let pullrequestTaskCreate: PullrequestTaskCreate; //The contents of the task

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksPost(
    pullRequestId,
    repoSlug,
    workspace,
    pullrequestTaskCreate
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullrequestTaskCreate** | **PullrequestTaskCreate**| The contents of the task | |
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PullrequestCommentTask**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created task. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**400** | There is a missing required field in the request or the task content is blank. |  -  |
|**403** | If the authenticated user does not have access to the pull request. |  -  |
|**404** | If the pull request does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdDelete**
> repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdDelete()

Deletes a specific pull request task.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let taskId: number; //The ID of the task. (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdDelete(
    pullRequestId,
    repoSlug,
    taskId,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **taskId** | [**number**] | The ID of the task. | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Successful deletion. |  -  |
|**403** | If the authenticated user does not have access to delete the task. |  -  |
|**404** | If the task does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdGet**
> PullrequestCommentTask repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdGet()

Returns a specific pull request task.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let taskId: number; //The ID of the task. (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdGet(
    pullRequestId,
    repoSlug,
    taskId,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **taskId** | [**number**] | The ID of the task. | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PullrequestCommentTask**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The task. |  -  |
|**403** | If the authenticated user does not have access to the pull request. |  -  |
|**404** | If the task does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdPut**
> PullrequestCommentTask repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdPut(pullrequestTaskUpdate)

Updates a specific pull request task.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration,
    PullrequestTaskUpdate
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let pullRequestId: number; //The id of the pull request. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let taskId: number; //The ID of the task. (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let pullrequestTaskUpdate: PullrequestTaskUpdate; //The updated state and content of the task.

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPullrequestsPullRequestIdTasksTaskIdPut(
    pullRequestId,
    repoSlug,
    taskId,
    workspace,
    pullrequestTaskUpdate
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pullrequestTaskUpdate** | **PullrequestTaskUpdate**| The updated state and content of the task. | |
| **pullRequestId** | [**number**] | The id of the pull request. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **taskId** | [**number**] | The ID of the task. | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PullrequestCommentTask**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The updated task. |  -  |
|**400** | There is a missing required field in the request or the task content is blank. |  -  |
|**403** | If the authenticated user does not have access to the pull request. |  -  |
|**404** | If the task does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **workspacesWorkspacePullrequestsSelectedUserGet**
> PaginatedPullrequests workspacesWorkspacePullrequestsSelectedUserGet()

Returns all workspace pull requests authored by the specified user.  By default only open pull requests are returned. This can be controlled using the `state` query parameter. To retrieve pull requests that are in one of multiple states, repeat the `state` parameter for each individual state.  This endpoint also supports filtering and sorting of the results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for more details.

### Example

```typescript
import {
    PullrequestsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PullrequestsApi(configuration);

let selectedUser: string; //This can either be the username of the pull request author, the author\'s UUID surrounded by curly-braces, for example: `{account UUID}`, or the author\'s Atlassian ID.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED'; //Only return pull requests that are in this state. This parameter can be repeated. (optional) (default to undefined)

const { status, data } = await apiInstance.workspacesWorkspacePullrequestsSelectedUserGet(
    selectedUser,
    workspace,
    state
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **selectedUser** | [**string**] | This can either be the username of the pull request author, the author\&#39;s UUID surrounded by curly-braces, for example: &#x60;{account UUID}&#x60;, or the author\&#39;s Atlassian ID.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **state** | [**&#39;OPEN&#39; | &#39;MERGED&#39; | &#39;DECLINED&#39; | &#39;SUPERSEDED&#39;**]**Array<&#39;OPEN&#39; &#124; &#39;MERGED&#39; &#124; &#39;DECLINED&#39; &#124; &#39;SUPERSEDED&#39;>** | Only return pull requests that are in this state. This parameter can be repeated. | (optional) defaults to undefined|


### Return type

**PaginatedPullrequests**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | All pull requests authored by the specified user. |  -  |
|**404** | If the specified user does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

