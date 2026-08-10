# IssueTrackerApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**repositoriesWorkspaceRepoSlugComponentsComponentIdGet**](#repositoriesworkspacereposlugcomponentscomponentidget) | **GET** /repositories/{workspace}/{repo_slug}/components/{component_id} | Get a component for issues|
|[**repositoriesWorkspaceRepoSlugComponentsGet**](#repositoriesworkspacereposlugcomponentsget) | **GET** /repositories/{workspace}/{repo_slug}/components | List components|
|[**repositoriesWorkspaceRepoSlugIssuesExportPost**](#repositoriesworkspacereposlugissuesexportpost) | **POST** /repositories/{workspace}/{repo_slug}/issues/export | Export issues|
|[**repositoriesWorkspaceRepoSlugIssuesExportRepoNameIssuesTaskIdZipGet**](#repositoriesworkspacereposlugissuesexportreponameissuestaskidzipget) | **GET** /repositories/{workspace}/{repo_slug}/issues/export/{repo_name}-issues-{task_id}.zip | Check issue export status|
|[**repositoriesWorkspaceRepoSlugIssuesGet**](#repositoriesworkspacereposlugissuesget) | **GET** /repositories/{workspace}/{repo_slug}/issues | List issues|
|[**repositoriesWorkspaceRepoSlugIssuesImportGet**](#repositoriesworkspacereposlugissuesimportget) | **GET** /repositories/{workspace}/{repo_slug}/issues/import | Check issue import status|
|[**repositoriesWorkspaceRepoSlugIssuesImportPost**](#repositoriesworkspacereposlugissuesimportpost) | **POST** /repositories/{workspace}/{repo_slug}/issues/import | Import issues|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsGet**](#repositoriesworkspacereposlugissuesissueidattachmentsget) | **GET** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments | List attachments for an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPathDelete**](#repositoriesworkspacereposlugissuesissueidattachmentspathdelete) | **DELETE** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments/{path} | Delete an attachment for an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPathGet**](#repositoriesworkspacereposlugissuesissueidattachmentspathget) | **GET** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments/{path} | Get attachment for an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPost**](#repositoriesworkspacereposlugissuesissueidattachmentspost) | **POST** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/attachments | Upload an attachment to an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdChangesChangeIdGet**](#repositoriesworkspacereposlugissuesissueidchangeschangeidget) | **GET** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/changes/{change_id} | Get issue change object|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdChangesGet**](#repositoriesworkspacereposlugissuesissueidchangesget) | **GET** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/changes | List changes on an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdChangesPost**](#repositoriesworkspacereposlugissuesissueidchangespost) | **POST** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/changes | Modify the state of an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdDelete**](#repositoriesworkspacereposlugissuesissueidcommentscommentiddelete) | **DELETE** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id} | Delete a comment on an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdGet**](#repositoriesworkspacereposlugissuesissueidcommentscommentidget) | **GET** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id} | Get a comment on an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdPut**](#repositoriesworkspacereposlugissuesissueidcommentscommentidput) | **PUT** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments/{comment_id} | Update a comment on an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsGet**](#repositoriesworkspacereposlugissuesissueidcommentsget) | **GET** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments | List comments on an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsPost**](#repositoriesworkspacereposlugissuesissueidcommentspost) | **POST** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments | Create a comment on an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdDelete**](#repositoriesworkspacereposlugissuesissueiddelete) | **DELETE** /repositories/{workspace}/{repo_slug}/issues/{issue_id} | Delete an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdGet**](#repositoriesworkspacereposlugissuesissueidget) | **GET** /repositories/{workspace}/{repo_slug}/issues/{issue_id} | Get an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdPut**](#repositoriesworkspacereposlugissuesissueidput) | **PUT** /repositories/{workspace}/{repo_slug}/issues/{issue_id} | Update an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdVoteDelete**](#repositoriesworkspacereposlugissuesissueidvotedelete) | **DELETE** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/vote | Remove vote for an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdVoteGet**](#repositoriesworkspacereposlugissuesissueidvoteget) | **GET** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/vote | Check if current user voted for an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdVotePut**](#repositoriesworkspacereposlugissuesissueidvoteput) | **PUT** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/vote | Vote for an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdWatchDelete**](#repositoriesworkspacereposlugissuesissueidwatchdelete) | **DELETE** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/watch | Stop watching an issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdWatchGet**](#repositoriesworkspacereposlugissuesissueidwatchget) | **GET** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/watch | Check if current user is watching a issue|
|[**repositoriesWorkspaceRepoSlugIssuesIssueIdWatchPut**](#repositoriesworkspacereposlugissuesissueidwatchput) | **PUT** /repositories/{workspace}/{repo_slug}/issues/{issue_id}/watch | Watch an issue|
|[**repositoriesWorkspaceRepoSlugIssuesPost**](#repositoriesworkspacereposlugissuespost) | **POST** /repositories/{workspace}/{repo_slug}/issues | Create an issue|
|[**repositoriesWorkspaceRepoSlugMilestonesGet**](#repositoriesworkspacereposlugmilestonesget) | **GET** /repositories/{workspace}/{repo_slug}/milestones | List milestones|
|[**repositoriesWorkspaceRepoSlugMilestonesMilestoneIdGet**](#repositoriesworkspacereposlugmilestonesmilestoneidget) | **GET** /repositories/{workspace}/{repo_slug}/milestones/{milestone_id} | Get a milestone|
|[**repositoriesWorkspaceRepoSlugVersionsGet**](#repositoriesworkspacereposlugversionsget) | **GET** /repositories/{workspace}/{repo_slug}/versions | List defined versions for issues|
|[**repositoriesWorkspaceRepoSlugVersionsVersionIdGet**](#repositoriesworkspacereposlugversionsversionidget) | **GET** /repositories/{workspace}/{repo_slug}/versions/{version_id} | Get a defined version for issues|

# **repositoriesWorkspaceRepoSlugComponentsComponentIdGet**
> Component repositoriesWorkspaceRepoSlugComponentsComponentIdGet()

Returns the specified issue tracker component object.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let componentId: number; //The component\'s id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugComponentsComponentIdGet(
    componentId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **componentId** | [**number**] | The component\&#39;s id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Component**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The specified component object. |  -  |
|**404** | The specified repository or component does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugComponentsGet**
> PaginatedComponents repositoriesWorkspaceRepoSlugComponentsGet()

Returns the components that have been defined in the issue tracker.  This resource is only available on repositories that have the issue tracker enabled.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugComponentsGet(
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

**PaginatedComponents**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The components that have been defined in the issue tracker. |  -  |
|**404** | The specified repository does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesExportPost**
> repositoriesWorkspaceRepoSlugIssuesExportPost()

A POST request to this endpoint initiates a new background celery task that archives the repo\'s issues.  When the job has been accepted, it will return a 202 (Accepted) along with a unique url to this job in the \'Location\' response header. This url is the endpoint for where the user can obtain their zip files.\"

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration,
    ExportOptions
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: ExportOptions; //The options to apply to the export. Available options include `project_key` and `project_name` which, if specified, are used as the Jira space key and name in the exported Jira json format. Option `send_email` specifies whether an email should be sent upon export result. Option `include_attachments` specifies whether attachments are included in the export. (optional)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesExportPost(
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **ExportOptions**| The options to apply to the export. Available options include &#x60;project_key&#x60; and &#x60;project_name&#x60; which, if specified, are used as the Jira space key and name in the exported Jira json format. Option &#x60;send_email&#x60; specifies whether an email should be sent upon export result. Option &#x60;include_attachments&#x60; specifies whether attachments are included in the export. | |
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** | The export job has been accepted |  -  |
|**401** | The request wasn\&#39;t authenticated properly |  -  |
|**403** | When the authenticated user does not have admin permission on the repo |  -  |
|**404** | The repo does not exist or does not have an issue tracker |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesExportRepoNameIssuesTaskIdZipGet**
> IssueJobStatus repositoriesWorkspaceRepoSlugIssuesExportRepoNameIssuesTaskIdZipGet()

This endpoint is used to poll for the progress of an issue export job and return the zip file after the job is complete. As long as the job is running, this will return a 202 response with in the response body a description of the current status.  After the job has been scheduled, but before it starts executing, the endpoint returns a 202 response with status `ACCEPTED`.  Once it starts running, it is a 202 response with status `STARTED` and progress filled.  After it is finished, it becomes a 200 response with status `SUCCESS` or `FAILURE`.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let repoName: string; //The name of the repo (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let taskId: string; //The ID of the export task (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesExportRepoNameIssuesTaskIdZipGet(
    repoName,
    repoSlug,
    taskId,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoName** | [**string**] | The name of the repo | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **taskId** | [**string**] | The ID of the export task | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**IssueJobStatus**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** | Export job accepted |  -  |
|**401** | The request wasn\&#39;t authenticated properly |  -  |
|**403** | When the authenticated user does not have admin permission on the repo |  -  |
|**404** | No export job has begun |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesGet**
> PaginatedIssues repositoriesWorkspaceRepoSlugIssuesGet()

Returns the issues in the issue tracker.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesGet(
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

**PaginatedIssues**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of the issues matching any filter criteria that were provided. |  -  |
|**404** | The specified repository does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesImportGet**
> IssueJobStatus repositoriesWorkspaceRepoSlugIssuesImportGet()

When using GET, this endpoint reports the status of the current import task.  After the job has been scheduled, but before it starts executing, the endpoint returns a 202 response with status `ACCEPTED`.  Once it starts running, it is a 202 response with status `STARTED` and progress filled.  After it is finished, it becomes a 200 response with status `SUCCESS` or `FAILURE`.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesImportGet(
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

**IssueJobStatus**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Import job complete with either FAILURE or SUCCESS status |  -  |
|**202** | Import job started |  -  |
|**401** | The request wasn\&#39;t authenticated properly |  -  |
|**403** | When the authenticated user does not have admin permission on the repo |  -  |
|**404** | No export job has begun |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesImportPost**
> IssueJobStatus repositoriesWorkspaceRepoSlugIssuesImportPost()

A POST request to this endpoint will import the zip file given by the archive parameter into the repository. All existing issues will be deleted and replaced by the contents of the imported zip file.  Imports are done through a multipart/form-data POST. There is one valid and required form field, with the name \"archive,\" which needs to be a file field:  ``` $ curl -u <username> -X POST -F archive=@/path/to/file.zip https://api.bitbucket.org/2.0/repositories/<owner_username>/<repo_slug>/issues/import ```

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesImportPost(
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

**IssueJobStatus**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** | Import job accepted |  -  |
|**401** | The request wasn\&#39;t authenticated properly |  -  |
|**403** | When the authenticated user does not have admin permission on the repo |  -  |
|**404** | No export job has begun |  -  |
|**409** | Import already running |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsGet**
> PaginatedIssueAttachments repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsGet()

Returns all attachments for this issue.  This returns the files\' meta data. This does not return the files\' actual contents.  The files are always ordered by their upload date.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsGet(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedIssueAttachments**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of all attachments for this issue. |  -  |
|**401** | If the issue tracker is private and the request was not authenticated. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPathDelete**
> repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPathDelete()

Deletes an attachment.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let path: string; //Path to the file. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPathDelete(
    issueId,
    path,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **path** | [**string**] | Path to the file. | defaults to undefined|
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
|**204** | Indicates that the deletion was successful |  -  |
|**401** | If the issue tracker is private and the request was not authenticated. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPathGet**
> repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPathGet()

Returns the contents of the specified file attachment.  Note that this endpoint does not return a JSON response, but instead returns a redirect pointing to the actual file that in turn will return the raw contents.  The redirect URL contains a one-time token that has a limited lifetime. As a result, the link should not be persisted, stored, or shared.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let path: string; //Path to the file. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPathGet(
    issueId,
    path,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **path** | [**string**] | Path to the file. | defaults to undefined|
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
|**302** | A redirect to the file\&#39;s contents |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**401** | If the issue tracker is private and the request was not authenticated. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPost**
> repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPost()

Upload new issue attachments.  To upload files, perform a `multipart/form-data` POST containing one or more file fields.  When a file is uploaded with the same name as an existing attachment, then the existing file will be replaced.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdAttachmentsPost(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
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
|**201** | An empty response document. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**400** | If no files were uploaded, or if the wrong &#x60;Content-Type&#x60; was used. |  -  |
|**401** | If the issue tracker is private and the request was not authenticated. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdChangesChangeIdGet**
> IssueChange repositoriesWorkspaceRepoSlugIssuesIssueIdChangesChangeIdGet()

Returns the specified issue change object.  This resource is only available on repositories that have the issue tracker enabled.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let changeId: string; //The issue change id (default to undefined)
let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdChangesChangeIdGet(
    changeId,
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **changeId** | [**string**] | The issue change id | defaults to undefined|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**IssueChange**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The specified issue change object. |  -  |
|**404** | The specified repository or issue change does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdChangesGet**
> PaginatedLogEntries repositoriesWorkspaceRepoSlugIssuesIssueIdChangesGet()

Returns the list of all changes that have been made to the specified issue. Changes are returned in chronological order with the oldest change first.  Each time an issue is edited in the UI or through the API, an immutable change record is created under the `/issues/123/changes` endpoint. It also has a comment associated with the change.  Note that this operation is changing significantly, due to privacy changes. See the [announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-changes-gdpr/#changes-to-the-issue-changes-api) for details.  Changes support [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) that can be used to search for specific changes. For instance, to see when an issue transitioned to \"resolved\":  ``` $ curl -s https://api.bitbucket.org/2.0/repositories/site/master/issues/1/changes \\    -G --data-urlencode=\'q=changes.state.new = \"resolved\"\' ```  This resource is only available on repositories that have the issue tracker enabled.  N.B.  The `changes.assignee` and `changes.assignee_account_id` fields are not a `user` object. Instead, they contain the raw `username` and `account_id` of the user. This is to protect the integrity of the audit log even after a user account gets deleted.  The `changes.assignee` field is deprecated will disappear in the future. Use `changes.assignee_account_id` instead.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let q: string; // Query string to narrow down the response. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for details. (optional) (default to undefined)
let sort: string; // Name of a response property to sort results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results) for details.  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdChangesGet(
    issueId,
    repoSlug,
    workspace,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **q** | [**string**] |  Query string to narrow down the response. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for details. | (optional) defaults to undefined|
| **sort** | [**string**] |  Name of a response property to sort results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#sorting-query-results) for details.  | (optional) defaults to undefined|


### Return type

**PaginatedLogEntries**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Returns all the issue changes that were made on the specified issue. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdChangesPost**
> IssueChange repositoriesWorkspaceRepoSlugIssuesIssueIdChangesPost(body)

Makes a change to the specified issue.  For example, to change an issue\'s state and assignee, create a new change object that modifies these fields:  ``` curl https://api.bitbucket.org/2.0/site/master/issues/1234/changes \\   -s -u evzijst -X POST -H \"Content-Type: application/json\" \\   -d \'{     \"changes\": {       \"assignee_account_id\": {         \"new\": \"557058:c0b72ad0-1cb5-4018-9cdc-0cde8492c443\"       },       \"state\": {         \"new\": \'resolved\"       }     }     \"message\": {       \"raw\": \"This is now resolved.\"     }   }\' ```  The above example also includes a custom comment to go alongside the change. This comment will also be visible on the issue page in the UI.  The fields of the `changes` object are strings, not objects. This allows for immutable change log records, even after user accounts, milestones, or other objects recorded in a change entry, get renamed or deleted.  The `assignee_account_id` field stores the account id. When POSTing a new change and changing the assignee, the client should therefore use the user\'s account_id in the `changes.assignee_account_id.new` field.  This call requires authentication. Private repositories or private issue trackers require the caller to authenticate with an account that has appropriate authorization.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration,
    IssueChange
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: IssueChange; //The new issue state change. The only required elements are `changes.[].new`. All other elements can be omitted from the body.

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdChangesPost(
    issueId,
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **IssueChange**| The new issue state change. The only required elements are &#x60;changes.[].new&#x60;. All other elements can be omitted from the body. | |
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**IssueChange**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created issue change. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**401** | When the request wasn\&#39;t authenticated. |  -  |
|**403** | When the authenticated user isn\&#39;t authorized to modify the issue. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdDelete**
> repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdDelete()

Deletes the specified comment.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdDelete(
    commentId,
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **issueId** | [**string**] | The issue id | defaults to undefined|
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
|**204** | Indicates successful deletion. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdGet**
> IssueComment repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdGet()

Returns the specified issue comment object.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdGet(
    commentId,
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**IssueComment**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The issue comment. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdPut**
> IssueComment repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdPut(body)

Updates the content of the specified issue comment. Note that only the `content.raw` field can be modified.  ``` $ curl https://api.bitbucket.org/2.0/repositories/atlassian/prlinks/issues/42/comments/5728901 \\   -X PUT -u evzijst \\   -H \'Content-Type: application/json\' \\   -d \'{\"content\": {\"raw\": \"Lorem ipsum.\"}\' ```

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration,
    IssueComment
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: IssueComment; //The updated comment.

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsCommentIdPut(
    commentId,
    issueId,
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **IssueComment**| The updated comment. | |
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**IssueComment**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The updated issue comment. |  -  |
|**400** | If the input was invalid, or if the update to the comment is detected as spam  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsGet**
> PaginatedIssueComments repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsGet()

Returns a paginated list of all comments that were made on the specified issue.  The default sorting is oldest to newest and can be overridden with the `sort` query parameter.  This endpoint also supports filtering and sorting of the results. See [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering) for more details.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let q: string; // Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsGet(
    issueId,
    repoSlug,
    workspace,
    q
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **q** | [**string**] |  Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering). | (optional) defaults to undefined|


### Return type

**PaginatedIssueComments**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of issue comments. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsPost**
> repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsPost(body)

Creates a new issue comment.  ``` $ curl https://api.bitbucket.org/2.0/repositories/atlassian/prlinks/issues/42/comments/ \\   -X POST -u evzijst \\   -H \'Content-Type: application/json\' \\   -d \'{\"content\": {\"raw\": \"Lorem ipsum.\"}}\' ```

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration,
    IssueComment
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: IssueComment; //The new issue comment object.

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdCommentsPost(
    issueId,
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **IssueComment**| The new issue comment object. | |
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created comment. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**400** | If the input was invalid, or if the comment being created is detected as spam  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdDelete**
> repositoriesWorkspaceRepoSlugIssuesIssueIdDelete()

Deletes the specified issue. This requires write access to the repository.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdDelete(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
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
|**204** | Indicates the issue was deleted successfully. |  -  |
|**403** | When the authenticated user isn\&#39;t authorized to delete the issue. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdGet**
> Issue repositoriesWorkspaceRepoSlugIssuesIssueIdGet()

Returns the specified issue.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdGet(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Issue**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The issue object. |  -  |
|**403** | When the authenticated user isn\&#39;t authorized to access the issue. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |
|**410** | The specified issue is unavailable. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdPut**
> Issue repositoriesWorkspaceRepoSlugIssuesIssueIdPut()

Modifies the issue.  ``` $ curl https://api.bitbucket.org/2.0/repostories/evzijst/dogslow/issues/123 \\   -u evzijst -s -X PUT -H \'Content-Type: application/json\' \\   -d \'{   \"title\": \"Updated title\",   \"assignee\": {     \"account_id\": \"5d5355e8c6b9320d9ea5b28d\"   },   \"priority\": \"minor\",   \"version\": {     \"name\": \"1.0\"   },   \"component\": null }\' ```  This example changes the `title`, `assignee`, `priority` and the `version`. It also removes the value of the `component` from the issue by setting the field to `null`. Any field not present keeps its existing value.  Each time an issue is edited in the UI or through the API, an immutable change record is created under the `/issues/123/changes` endpoint. It also has a comment associated with the change.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdPut(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Issue**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The updated issue object. |  -  |
|**403** | When the authenticated user isn\&#39;t authorized to access the issue. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdVoteDelete**
> ModelError repositoriesWorkspaceRepoSlugIssuesIssueIdVoteDelete()

Retract your vote.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdVoteDelete(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ModelError**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**0** | Unexpected error. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdVoteGet**
> ModelError repositoriesWorkspaceRepoSlugIssuesIssueIdVoteGet()

Check whether the authenticated user has voted for this issue. A 204 status code indicates that the user has voted, while a 404 implies they haven\'t.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdVoteGet(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ModelError**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | If the authenticated user has not voted for this issue. |  -  |
|**401** | When the request wasn\&#39;t authenticated. |  -  |
|**404** | If the authenticated user has not voted for this issue, or when the repo does not exist, or does not have an issue tracker. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdVotePut**
> ModelError repositoriesWorkspaceRepoSlugIssuesIssueIdVotePut()

Vote for this issue.  To cast your vote, do an empty PUT. The 204 status code indicates that the operation was successful.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdVotePut(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ModelError**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Indicating the authenticated user has cast their vote successfully. |  -  |
|**401** | When the request wasn\&#39;t authenticated. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdWatchDelete**
> ModelError repositoriesWorkspaceRepoSlugIssuesIssueIdWatchDelete()

Stop watching this issue.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdWatchDelete(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ModelError**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Indicates that the authenticated user successfully stopped watching this issue. |  -  |
|**401** | When the request wasn\&#39;t authenticated. |  -  |
|**404** | The specified repository or issue does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdWatchGet**
> ModelError repositoriesWorkspaceRepoSlugIssuesIssueIdWatchGet()

Indicated whether or not the authenticated user is watching this issue.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdWatchGet(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ModelError**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | If the authenticated user is watching this issue. |  -  |
|**401** | When the request wasn\&#39;t authenticated. |  -  |
|**404** | If the authenticated user is not watching this issue, or when the repo does not exist, or does not have an issue tracker. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesIssueIdWatchPut**
> ModelError repositoriesWorkspaceRepoSlugIssuesIssueIdWatchPut()

Start watching this issue.  To start watching this issue, do an empty PUT. The 204 status code indicates that the operation was successful.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let issueId: string; //The issue id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesIssueIdWatchPut(
    issueId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **issueId** | [**string**] | The issue id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**ModelError**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Indicates that the authenticated user successfully started watching this issue. |  -  |
|**401** | When the request wasn\&#39;t authenticated. |  -  |
|**404** | If the authenticated user is not watching this issue, or when the repo does not exist, or does not have an issue tracker. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugIssuesPost**
> Issue repositoriesWorkspaceRepoSlugIssuesPost(body)

Creates a new issue.  This call requires authentication. Private repositories or private issue trackers require the caller to authenticate with an account that has appropriate authorization.  The authenticated user is used for the issue\'s `reporter` field.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration,
    Issue
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: Issue; //The new issue. The only required element is `title`. All other elements can be omitted from the body.

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugIssuesPost(
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Issue**| The new issue. The only required element is &#x60;title&#x60;. All other elements can be omitted from the body. | |
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Issue**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created issue. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**401** | When the request wasn\&#39;t authenticated. |  -  |
|**403** | When the authenticated user isn\&#39;t authorized to create the issue. |  -  |
|**404** | The specified repository does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugMilestonesGet**
> PaginatedMilestones repositoriesWorkspaceRepoSlugMilestonesGet()

Returns the milestones that have been defined in the issue tracker.  This resource is only available on repositories that have the issue tracker enabled.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugMilestonesGet(
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

**PaginatedMilestones**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The milestones that have been defined in the issue tracker. |  -  |
|**404** | The specified repository does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugMilestonesMilestoneIdGet**
> Milestone repositoriesWorkspaceRepoSlugMilestonesMilestoneIdGet()

Returns the specified issue tracker milestone object.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let milestoneId: number; //The milestone\'s id (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugMilestonesMilestoneIdGet(
    milestoneId,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **milestoneId** | [**number**] | The milestone\&#39;s id | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Milestone**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The specified milestone object. |  -  |
|**404** | The specified repository or milestone does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugVersionsGet**
> PaginatedVersions repositoriesWorkspaceRepoSlugVersionsGet()

Returns the versions that have been defined in the issue tracker.  This resource is only available on repositories that have the issue tracker enabled.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugVersionsGet(
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

**PaginatedVersions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The versions that have been defined in the issue tracker. |  -  |
|**404** | The specified repository does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugVersionsVersionIdGet**
> Version repositoriesWorkspaceRepoSlugVersionsVersionIdGet()

Returns the specified issue tracker version object.

### Example

```typescript
import {
    IssueTrackerApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new IssueTrackerApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let versionId: number; //The version\'s id (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugVersionsVersionIdGet(
    repoSlug,
    versionId,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **versionId** | [**number**] | The version\&#39;s id | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Version**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The specified version object. |  -  |
|**404** | The specified repository or version does not exist or does not have the issue tracker enabled. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

