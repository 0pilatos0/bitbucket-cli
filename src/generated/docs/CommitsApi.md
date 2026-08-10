# CommitsApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**bulkCreateOrUpdateAnnotations**](#bulkcreateorupdateannotations) | **POST** /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations | Bulk create or update annotations|
|[**createOrUpdateAnnotation**](#createorupdateannotation) | **PUT** /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations/{annotationId} | Create or update an annotation|
|[**createOrUpdateReport**](#createorupdatereport) | **PUT** /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId} | Create or update a report|
|[**deleteAnnotation**](#deleteannotation) | **DELETE** /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations/{annotationId} | Delete an annotation|
|[**deleteReport**](#deletereport) | **DELETE** /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId} | Delete a report|
|[**getAnnotation**](#getannotation) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations/{annotationId} | Get an annotation|
|[**getAnnotationsForReport**](#getannotationsforreport) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId}/annotations | List annotations|
|[**getReport**](#getreport) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit}/reports/{reportId} | Get a report|
|[**getReportsForCommit**](#getreportsforcommit) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit}/reports | List reports|
|[**repositoriesWorkspaceRepoSlugCommitCommitApproveDelete**](#repositoriesworkspacereposlugcommitcommitapprovedelete) | **DELETE** /repositories/{workspace}/{repo_slug}/commit/{commit}/approve | Unapprove a commit|
|[**repositoriesWorkspaceRepoSlugCommitCommitApprovePost**](#repositoriesworkspacereposlugcommitcommitapprovepost) | **POST** /repositories/{workspace}/{repo_slug}/commit/{commit}/approve | Approve a commit|
|[**repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdDelete**](#repositoriesworkspacereposlugcommitcommitcommentscommentiddelete) | **DELETE** /repositories/{workspace}/{repo_slug}/commit/{commit}/comments/{comment_id} | Delete a commit comment|
|[**repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdGet**](#repositoriesworkspacereposlugcommitcommitcommentscommentidget) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit}/comments/{comment_id} | Get a commit comment|
|[**repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdPut**](#repositoriesworkspacereposlugcommitcommitcommentscommentidput) | **PUT** /repositories/{workspace}/{repo_slug}/commit/{commit}/comments/{comment_id} | Update a commit comment|
|[**repositoriesWorkspaceRepoSlugCommitCommitCommentsGet**](#repositoriesworkspacereposlugcommitcommitcommentsget) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit}/comments | List a commit\&#39;s comments|
|[**repositoriesWorkspaceRepoSlugCommitCommitCommentsPost**](#repositoriesworkspacereposlugcommitcommitcommentspost) | **POST** /repositories/{workspace}/{repo_slug}/commit/{commit}/comments | Create comment for a commit|
|[**repositoriesWorkspaceRepoSlugCommitCommitGet**](#repositoriesworkspacereposlugcommitcommitget) | **GET** /repositories/{workspace}/{repo_slug}/commit/{commit} | Get a commit|
|[**repositoriesWorkspaceRepoSlugCommitsGet**](#repositoriesworkspacereposlugcommitsget) | **GET** /repositories/{workspace}/{repo_slug}/commits | List commits|
|[**repositoriesWorkspaceRepoSlugCommitsPost**](#repositoriesworkspacereposlugcommitspost) | **POST** /repositories/{workspace}/{repo_slug}/commits | List commits with include/exclude|
|[**repositoriesWorkspaceRepoSlugCommitsRevisionGet**](#repositoriesworkspacereposlugcommitsrevisionget) | **GET** /repositories/{workspace}/{repo_slug}/commits/{revision} | List commits for revision|
|[**repositoriesWorkspaceRepoSlugCommitsRevisionPost**](#repositoriesworkspacereposlugcommitsrevisionpost) | **POST** /repositories/{workspace}/{repo_slug}/commits/{revision} | List commits for revision using include/exclude|
|[**repositoriesWorkspaceRepoSlugDiffSpecGet**](#repositoriesworkspacereposlugdiffspecget) | **GET** /repositories/{workspace}/{repo_slug}/diff/{spec} | Compare two commits|
|[**repositoriesWorkspaceRepoSlugDiffstatSpecGet**](#repositoriesworkspacereposlugdiffstatspecget) | **GET** /repositories/{workspace}/{repo_slug}/diffstat/{spec} | Compare two commit diff stats|
|[**repositoriesWorkspaceRepoSlugFileConflictsSpecGet**](#repositoriesworkspacereposlugfileconflictsspecget) | **GET** /repositories/{workspace}/{repo_slug}/file-conflicts/{spec} | Get file conflicts for a commit spec|
|[**repositoriesWorkspaceRepoSlugMergeBaseRevspecGet**](#repositoriesworkspacereposlugmergebaserevspecget) | **GET** /repositories/{workspace}/{repo_slug}/merge-base/{revspec} | Get the common ancestor between two commits|
|[**repositoriesWorkspaceRepoSlugPatchSpecGet**](#repositoriesworkspacereposlugpatchspecget) | **GET** /repositories/{workspace}/{repo_slug}/patch/{spec} | Get a patch for two commits|

# **bulkCreateOrUpdateAnnotations**
> Array<ReportAnnotation> bulkCreateOrUpdateAnnotations(body)

Bulk upload of annotations. Annotations are individual findings that have been identified as part of a report, for example, a line of code that represents a vulnerability. These annotations can be attached to a specific file and even a specific line in that file, however, that is optional. Annotations are not mandatory and a report can contain up to 1000 annotations.  Add the annotations you want to upload as objects in a JSON array and make sure each annotation has the external_id field set to a unique value. If you want to use an existing id from your own system, we recommend prefixing it with your system\'s name to avoid collisions, for example, mySystem-annotation001. The external id can later be used to identify the report as an alternative to the generated [UUID](https://developer.atlassian.com/bitbucket/api/2/reference/meta/uri-uuid#uuid). You can upload up to 100 annotations per POST request.  ### Sample cURL request: ``` curl --location \'https://api.bitbucket.org/2.0/repositories/<username>/<reposity-name>/commit/<commit-hash>/reports/mysystem-001/annotations\' \\ --header \'Content-Type: application/json\' \\ --data-raw \'[   {         \"external_id\": \"mysystem-annotation001\",         \"title\": \"Security scan report\",         \"annotation_type\": \"VULNERABILITY\",         \"summary\": \"This line represents a security threat.\",         \"severity\": \"HIGH\",       \"path\": \"my-service/src/main/java/com/myCompany/mysystem/logic/Main.java\",         \"line\": 42   },   {         \"external_id\": \"mySystem-annotation002\",         \"title\": \"Bug report\",         \"annotation_type\": \"BUG\",         \"result\": \"FAILED\",         \"summary\": \"This line might introduce a bug.\",         \"severity\": \"MEDIUM\",       \"path\": \"my-service/src/main/java/com/myCompany/mysystem/logic/Helper.java\",         \"line\": 13   } ]\' ```  ### Possible field values: annotation_type: VULNERABILITY, CODE_SMELL, BUG result: PASSED, FAILED, IGNORED, SKIPPED severity: HIGH, MEDIUM, LOW, CRITICAL  Please refer to the [Code Insights documentation](https://confluence.atlassian.com/bitbucket/code-insights-994316785.html) for more information. 

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit for which to retrieve reports. (default to undefined)
let reportId: string; //Uuid or external-if of the report for which to get annotations for. (default to undefined)
let body: Array<ReportAnnotation>; //The annotations to create or update

const { status, data } = await apiInstance.bulkCreateOrUpdateAnnotations(
    workspace,
    repoSlug,
    commit,
    reportId,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Array<ReportAnnotation>**| The annotations to create or update | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit for which to retrieve reports. | defaults to undefined|
| **reportId** | [**string**] | Uuid or external-if of the report for which to get annotations for. | defaults to undefined|


### Return type

**Array<ReportAnnotation>**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createOrUpdateAnnotation**
> ReportAnnotation createOrUpdateAnnotation(body)

Creates or updates an individual annotation for the specified report. Annotations are individual findings that have been identified as part of a report, for example, a line of code that represents a vulnerability. These annotations can be attached to a specific file and even a specific line in that file, however, that is optional. Annotations are not mandatory and a report can contain up to 1000 annotations.  Just as reports, annotation needs to be uploaded with a unique ID that can later be used to identify the report as an alternative to the generated [UUID](https://developer.atlassian.com/bitbucket/api/2/reference/meta/uri-uuid#uuid). If you want to use an existing id from your own system, we recommend prefixing it with your system\'s name to avoid collisions, for example, mySystem-annotation001.  ### Sample cURL request: ``` curl --request PUT \'https://api.bitbucket.org/2.0/repositories/<username>/<reposity-name>/commit/<commit-hash>/reports/mySystem-001/annotations/mysystem-annotation001\' \\ --header \'Content-Type: application/json\' \\ --data-raw \'{     \"title\": \"Security scan report\",     \"annotation_type\": \"VULNERABILITY\",     \"summary\": \"This line represents a security thread.\",     \"severity\": \"HIGH\",     \"path\": \"my-service/src/main/java/com/myCompany/mysystem/logic/Main.java\",     \"line\": 42 }\' ```  ### Possible field values: annotation_type: VULNERABILITY, CODE_SMELL, BUG result: PASSED, FAILED, IGNORED, SKIPPED severity: HIGH, MEDIUM, LOW, CRITICAL  Please refer to the [Code Insights documentation](https://confluence.atlassian.com/bitbucket/code-insights-994316785.html) for more information. 

### Example

```typescript
import {
    CommitsApi,
    Configuration,
    ReportAnnotation
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit the report belongs to. (default to undefined)
let reportId: string; //Either the uuid or external-id of the report. (default to undefined)
let annotationId: string; //Either the uuid or external-id of the annotation. (default to undefined)
let body: ReportAnnotation; //The annotation to create or update

const { status, data } = await apiInstance.createOrUpdateAnnotation(
    workspace,
    repoSlug,
    commit,
    reportId,
    annotationId,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **ReportAnnotation**| The annotation to create or update | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit the report belongs to. | defaults to undefined|
| **reportId** | [**string**] | Either the uuid or external-id of the report. | defaults to undefined|
| **annotationId** | [**string**] | Either the uuid or external-id of the annotation. | defaults to undefined|


### Return type

**ReportAnnotation**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | The provided Annotation object is malformed or incomplete. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createOrUpdateReport**
> Report createOrUpdateReport(body)

Creates or updates a report for the specified commit. To upload a report, make sure to generate an ID that is unique across all reports for that commit. If you want to use an existing id from your own system, we recommend prefixing it with your system\'s name to avoid collisions, for example, mySystem-001.  ### Sample cURL request: ``` curl --request PUT \'https://api.bitbucket.org/2.0/repositories/<username>/<reposity-name>/commit/<commit-hash>/reports/mysystem-001\' \\ --header \'Content-Type: application/json\' \\ --data-raw \'{     \"title\": \"Security scan report\",     \"details\": \"This pull request introduces 10 new dependency vulnerabilities.\",     \"report_type\": \"SECURITY\",     \"reporter\": \"mySystem\",     \"link\": \"http://www.mysystem.com/reports/001\",     \"result\": \"FAILED\",     \"data\": [         {             \"title\": \"Duration (seconds)\",             \"type\": \"DURATION\",             \"value\": 14         },         {             \"title\": \"Safe to merge?\",             \"type\": \"BOOLEAN\",             \"value\": false         }     ] }\' ```  ### Possible field values: report_type: SECURITY, COVERAGE, TEST, BUG result: PASSED, FAILED, PENDING data.type: BOOLEAN, DATE, DURATION, LINK, NUMBER, PERCENTAGE, TEXT  #### Data field formats | Type  Field   | Value Field Type  | Value Field Display | |:--------------|:------------------|:--------------------| | None/ Omitted | Number, String or Boolean (not an array or object) | Plain text | | BOOLEAN | Boolean | The value will be read as a JSON boolean and displayed as \'Yes\' or \'No\'. | | DATE  | Number | The value will be read as a JSON number in the form of a Unix timestamp (milliseconds) and will be displayed as a relative date if the date is less than one week ago, otherwise  it will be displayed as an absolute date. | | DURATION | Number | The value will be read as a JSON number in milliseconds and will be displayed in a human readable duration format. | | LINK | Object: `{\"text\": \"Link text here\", \"href\": \"https://link.to.annotation/in/external/tool\"}` | The value will be read as a JSON object containing the fields \"text\" and \"href\" and will be displayed as a clickable link on the report. | | NUMBER | Number | The value will be read as a JSON number and large numbers will be  displayed in a human readable format (e.g. 14.3k). | | PERCENTAGE | Number (between 0 and 100) | The value will be read as a JSON number between 0 and 100 and will be displayed with a percentage sign. | | TEXT | String | The value will be read as a JSON string and will be displayed as-is |  Please refer to the [Code Insights documentation](https://confluence.atlassian.com/bitbucket/code-insights-994316785.html) for more information. 

### Example

```typescript
import {
    CommitsApi,
    Configuration,
    Report
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit the report belongs to. (default to undefined)
let reportId: string; //Either the uuid or external-id of the report. (default to undefined)
let body: Report; //The report to create or update

const { status, data } = await apiInstance.createOrUpdateReport(
    workspace,
    repoSlug,
    commit,
    reportId,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **Report**| The report to create or update | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit the report belongs to. | defaults to undefined|
| **reportId** | [**string**] | Either the uuid or external-id of the report. | defaults to undefined|


### Return type

**Report**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | The provided Report object is malformed or incomplete. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteAnnotation**
> deleteAnnotation()

Deletes a single Annotation matching the provided ID.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit the annotation belongs to. (default to undefined)
let reportId: string; //Either the uuid or external-id of the annotation. (default to undefined)
let annotationId: string; //Either the uuid or external-id of the annotation. (default to undefined)

const { status, data } = await apiInstance.deleteAnnotation(
    workspace,
    repoSlug,
    commit,
    reportId,
    annotationId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit the annotation belongs to. | defaults to undefined|
| **reportId** | [**string**] | Either the uuid or external-id of the annotation. | defaults to undefined|
| **annotationId** | [**string**] | Either the uuid or external-id of the annotation. | defaults to undefined|


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
|**204** | No content |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteReport**
> deleteReport()

Deletes a single Report matching the provided ID.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit the report belongs to. (default to undefined)
let reportId: string; //Either the uuid or external-id of the report. (default to undefined)

const { status, data } = await apiInstance.deleteReport(
    workspace,
    repoSlug,
    commit,
    reportId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit the report belongs to. | defaults to undefined|
| **reportId** | [**string**] | Either the uuid or external-id of the report. | defaults to undefined|


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
|**204** | No content |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAnnotation**
> ReportAnnotation getAnnotation()

Returns a single Annotation matching the provided ID.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit the report belongs to. (default to undefined)
let reportId: string; //Either the uuid or external-id of the report. (default to undefined)
let annotationId: string; //Either the uuid or external-id of the annotation. (default to undefined)

const { status, data } = await apiInstance.getAnnotation(
    workspace,
    repoSlug,
    commit,
    reportId,
    annotationId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit the report belongs to. | defaults to undefined|
| **reportId** | [**string**] | Either the uuid or external-id of the report. | defaults to undefined|
| **annotationId** | [**string**] | Either the uuid or external-id of the annotation. | defaults to undefined|


### Return type

**ReportAnnotation**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**404** | The annotation with the given ID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAnnotationsForReport**
> PaginatedAnnotations getAnnotationsForReport()

Returns a paginated list of Annotations for a specified report.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit for which to retrieve reports. (default to undefined)
let reportId: string; //Uuid or external-if of the report for which to get annotations for. (default to undefined)

const { status, data } = await apiInstance.getAnnotationsForReport(
    workspace,
    repoSlug,
    commit,
    reportId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit for which to retrieve reports. | defaults to undefined|
| **reportId** | [**string**] | Uuid or external-if of the report for which to get annotations for. | defaults to undefined|


### Return type

**PaginatedAnnotations**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getReport**
> Report getReport()

Returns a single Report matching the provided ID.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit the report belongs to. (default to undefined)
let reportId: string; //Either the uuid or external-id of the report. (default to undefined)

const { status, data } = await apiInstance.getReport(
    workspace,
    repoSlug,
    commit,
    reportId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit the report belongs to. | defaults to undefined|
| **reportId** | [**string**] | Either the uuid or external-id of the report. | defaults to undefined|


### Return type

**Report**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**404** | The report with the given ID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getReportsForCommit**
> PaginatedReports getReportsForCommit()

Returns a paginated list of Reports linked to this commit.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let commit: string; //The commit for which to retrieve reports. (default to undefined)

const { status, data } = await apiInstance.getReportsForCommit(
    workspace,
    repoSlug,
    commit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **commit** | [**string**] | The commit for which to retrieve reports. | defaults to undefined|


### Return type

**PaginatedReports**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitApproveDelete**
> repositoriesWorkspaceRepoSlugCommitCommitApproveDelete()

Redact the authenticated user\'s approval of the specified commit.  This operation is only available to users that have explicit access to the repository. In contrast, just the fact that a repository is publicly accessible to users does not give them the ability to approve commits.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitApproveDelete(
    commit,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
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
|**404** | If the specified commit, or the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitApprovePost**
> Participant repositoriesWorkspaceRepoSlugCommitCommitApprovePost()

Approve the specified commit as the authenticated user.  This operation is only available to users that have explicit access to the repository. In contrast, just the fact that a repository is publicly accessible to users does not give them the ability to approve commits.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitApprovePost(
    commit,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
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
|**200** | The &#x60;participant&#x60; object recording that the authenticated user approved the commit. |  -  |
|**404** | If the specified commit, or the repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdDelete**
> repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdDelete()

Deletes the specified commit comment.  Note that deleting comments that have visible replies that point to them will not really delete the resource. This is to retain the integrity of the original comment tree. Instead, the `deleted` element is set to `true` and the content is blanked out. The comment will continue to be returned by the collections and self endpoints.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let commit: string; //The commit\'s SHA1. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdDelete(
    commentId,
    commit,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
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
|**204** | Indicates the comment was deleted by this action or a previous delete. |  -  |
|**404** | If the comment doesn\&#39;t exist |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdGet**
> CommitComment repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdGet()

Returns the specified commit comment.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let commit: string; //The commit\'s SHA1. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdGet(
    commentId,
    commit,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**CommitComment**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The commit comment. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdPut**
> repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdPut(body)

Used to update the contents of a comment. Only the content of the comment can be updated.  ``` $ curl https://api.bitbucket.org/2.0/repositories/atlassian/prlinks/commit/7f71b5/comments/5728901 \\   -X PUT -u evzijst \\   -H \'Content-Type: application/json\' \\   -d \'{\"content\": {\"raw\": \"One more thing!\"}\' ```

### Example

```typescript
import {
    CommitsApi,
    Configuration,
    CommitComment
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let commentId: number; //The id of the comment. (default to undefined)
let commit: string; //The commit\'s SHA1. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: CommitComment; //The updated comment.

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitCommentsCommentIdPut(
    commentId,
    commit,
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **CommitComment**| The updated comment. | |
| **commentId** | [**number**] | The id of the comment. | defaults to undefined|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly updated comment. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**400** | If the comment update was detected as spam |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitCommentsGet**
> PaginatedCommitComments repositoriesWorkspaceRepoSlugCommitCommitCommentsGet()

Returns the commit\'s comments.  This includes both global and inline comments.  The default sorting is oldest to newest and can be overridden with the `sort` query parameter.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let q: string; //Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  (optional) (default to undefined)
let sort: string; //Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitCommentsGet(
    commit,
    repoSlug,
    workspace,
    q,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **q** | [**string**] | Query string to narrow down the response as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  | (optional) defaults to undefined|
| **sort** | [**string**] | Field by which the results should be sorted as per [filtering and sorting](/cloud/bitbucket/rest/intro/#filtering).  | (optional) defaults to undefined|


### Return type

**PaginatedCommitComments**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of commit comments. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitCommentsPost**
> repositoriesWorkspaceRepoSlugCommitCommitCommentsPost(body)

Creates new comment on the specified commit.  To post a reply to an existing comment, include the `parent.id` field:  ``` $ curl https://api.bitbucket.org/2.0/repositories/atlassian/prlinks/commit/db9ba1e031d07a02603eae0e559a7adc010257fc/comments/ \\   -X POST -u evzijst \\   -H \'Content-Type: application/json\' \\   -d \'{\"content\": {\"raw\": \"One more thing!\"},        \"parent\": {\"id\": 5728901}}\' ```

### Example

```typescript
import {
    CommitsApi,
    Configuration,
    CommitComment
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let body: CommitComment; //The specified comment.

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitCommentsPost(
    commit,
    repoSlug,
    workspace,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **CommitComment**| The specified comment. | |
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The newly created comment. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**400** | If the comment was detected as spam, or if the parent comment is not attached to the same node as the new comment |  -  |
|**404** | If a parent ID was passed in that cannot be found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitCommitGet**
> Commit repositoriesWorkspaceRepoSlugCommitCommitGet()

Returns the specified commit.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let commit: string; //The commit\'s SHA1. (default to undefined)
let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitCommitGet(
    commit,
    repoSlug,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **commit** | [**string**] | The commit\&#39;s SHA1. | defaults to undefined|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Commit**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The commit object |  -  |
|**404** | If the specified commit or repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitsGet**
> PaginatedChangeset repositoriesWorkspaceRepoSlugCommitsGet()

These are the repository\'s commits. They are paginated and returned in reverse chronological order, similar to the output of `git log`. Like these tools, the DAG can be filtered.  #### GET /repositories/{workspace}/{repo_slug}/commits/  Returns all commits in the repo in topological order (newest commit first). All branches and tags are included (similar to `git log --all`).  #### GET /repositories/{workspace}/{repo_slug}/commits/?exclude=master  Returns all commits in the repo that are not on master (similar to `git log --all ^master`).  #### GET /repositories/{workspace}/{repo_slug}/commits/?include=foo&include=bar&exclude=fu&exclude=fubar  Returns all commits that are on refs `foo` or `bar`, but not on `fu` or `fubar` (similar to `git log foo bar ^fu ^fubar`).  An optional `path` parameter can be specified that will limit the results to commits that affect that path. `path` can either be a file or a directory. If a directory is specified, commits are returned that have modified any file in the directory tree rooted by `path`. It is important to note that if the `path` parameter is specified, the commits returned by this endpoint may no longer be a DAG, parent commits that do not modify the path will be omitted from the response.  #### GET /repositories/{workspace}/{repo_slug}/commits/?path=README.md&include=foo&include=bar&exclude=master  Returns all commits that are on refs `foo` or `bar`, but not on `master` that changed the file README.md.  #### GET /repositories/{workspace}/{repo_slug}/commits/?path=src/&include=foo&include=bar&exclude=master  Returns all commits that are on refs `foo` or `bar`, but not on `master` that changed to a file in any file in the directory src or its children.  Because the response could include a very large number of commits, it is paginated. Follow the \'next\' link in the response to navigate to the next page of commits. As with other paginated resources, do not construct your own links.  When the include and exclude parameters are more than can fit in a query string, clients can use a `x-www-form-urlencoded` POST instead.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitsGet(
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

**PaginatedChangeset**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of commits |  -  |
|**404** | If the specified repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitsPost**
> PaginatedChangeset repositoriesWorkspaceRepoSlugCommitsPost()

Identical to `GET /repositories/{workspace}/{repo_slug}/commits`, except that POST allows clients to place the include and exclude parameters in the request body to avoid URL length issues.  **Note that this resource does NOT support new commit creation.**

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitsPost(
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

**PaginatedChangeset**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of commits |  -  |
|**404** | If the specified repository does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitsRevisionGet**
> PaginatedChangeset repositoriesWorkspaceRepoSlugCommitsRevisionGet()

These are the repository\'s commits. They are paginated and returned in reverse chronological order, similar to the output of `git log`. Like these tools, the DAG can be filtered.  #### GET /repositories/{workspace}/{repo_slug}/commits/master  Returns all commits on ref `master` (similar to `git log master`).  #### GET /repositories/{workspace}/{repo_slug}/commits/dev?include=foo&exclude=master  Returns all commits on ref `dev` or `foo`, except those that are reachable on `master` (similar to `git log dev foo ^master`).  An optional `path` parameter can be specified that will limit the results to commits that affect that path. `path` can either be a file or a directory. If a directory is specified, commits are returned that have modified any file in the directory tree rooted by `path`. It is important to note that if the `path` parameter is specified, the commits returned by this endpoint may no longer be a DAG, parent commits that do not modify the path will be omitted from the response.  #### GET /repositories/{workspace}/{repo_slug}/commits/dev?path=README.md&include=foo&include=bar&exclude=master  Returns all commits that are on refs `dev` or `foo` or `bar`, but not on `master` that changed the file README.md.  #### GET /repositories/{workspace}/{repo_slug}/commits/dev?path=src/&include=foo&exclude=master  Returns all commits that are on refs `dev` or `foo`, but not on `master` that changed to a file in any file in the directory src or its children.  Because the response could include a very large number of commits, it is paginated. Follow the \'next\' link in the response to navigate to the next page of commits. As with other paginated resources, do not construct your own links.  When the include and exclude parameters are more than can fit in a query string, clients can use a `x-www-form-urlencoded` POST instead.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let revision: string; //A commit SHA1 or ref name. (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitsRevisionGet(
    repoSlug,
    revision,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **revision** | [**string**] | A commit SHA1 or ref name. | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedChangeset**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of commits |  -  |
|**404** | If the specified revision does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugCommitsRevisionPost**
> PaginatedChangeset repositoriesWorkspaceRepoSlugCommitsRevisionPost()

Identical to `GET /repositories/{workspace}/{repo_slug}/commits/{revision}`, except that POST allows clients to place the include and exclude parameters in the request body to avoid URL length issues.  **Note that this resource does NOT support new commit creation.**

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let revision: string; //A commit SHA1 or ref name. (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugCommitsRevisionPost(
    repoSlug,
    revision,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **revision** | [**string**] | A commit SHA1 or ref name. | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedChangeset**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of commits |  -  |
|**404** | If the specified revision does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDiffSpecGet**
> repositoriesWorkspaceRepoSlugDiffSpecGet()

Produces a raw git-style diff.  #### Single commit spec  If the `spec` argument to this API is a single commit, the diff is produced against the first parent of the specified commit.  #### Two commit spec  Two commits separated by `..` may be provided as the `spec`, e.g., `3a8b42..9ff173`. When two commits are provided and the `topic` query parameter is true, this API produces a 2-way three dot diff. This is the diff between source commit and the merge base of the source commit and the destination commit. When the `topic` query param is false, a simple git-style diff is produced.  The two commits are interpreted as follows:  * First commit: the commit containing the changes we wish to preview * Second commit: the commit representing the state to which we want to   compare the first commit * **Note**: This is the opposite of the order used in `git diff`.  #### Comparison to patches  While similar to patches, diffs:  * Don\'t have a commit header (username, commit message, etc) * Support the optional `path=foo/bar.py` query param to filter   the diff to just that one file diff  #### Response  The raw diff is returned as-is, in whatever encoding the files in the repository use. It is not decoded into unicode. As such, the content-type is `text/plain`.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let spec: string; //A commit SHA (e.g. `3a8b42`) or a commit range using double dot notation (e.g. `3a8b42..9ff173`).  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let context: number; //Generate diffs with <n> lines of context instead of the usual three. (optional) (default to undefined)
let path: string; //Limit the diff to a particular file (this parameter can be repeated for multiple paths). (optional) (default to undefined)
let ignoreWhitespace: boolean; //Generate diffs that ignore whitespace. (optional) (default to undefined)
let binary: boolean; //Generate diffs that include binary files, true if omitted. (optional) (default to undefined)
let renames: boolean; //Whether to perform rename detection, true if omitted. (optional) (default to undefined)
let merge: boolean; //This parameter is deprecated. The \'topic\' parameter should be used instead. The \'merge\' and \'topic\' parameters cannot be both used at the same time.  If true, the source commit is merged into the destination commit, and then a diff from the destination to the merge result is returned. If false, a simple \'two dot\' diff between the source and destination is returned. True if omitted. (optional) (default to undefined)
let topic: boolean; //If true, returns 2-way \'three-dot\' diff. This is a diff between the source commit and the merge base of the source commit and the destination commit. If false, a simple \'two dot\' diff between the source and destination is returned.  If omitted, defaults to true, ie. a 2 way \'three-dot\' diff is returned.  (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDiffSpecGet(
    repoSlug,
    spec,
    workspace,
    context,
    path,
    ignoreWhitespace,
    binary,
    renames,
    merge,
    topic
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **spec** | [**string**] | A commit SHA (e.g. &#x60;3a8b42&#x60;) or a commit range using double dot notation (e.g. &#x60;3a8b42..9ff173&#x60;).  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **context** | [**number**] | Generate diffs with &lt;n&gt; lines of context instead of the usual three. | (optional) defaults to undefined|
| **path** | [**string**] | Limit the diff to a particular file (this parameter can be repeated for multiple paths). | (optional) defaults to undefined|
| **ignoreWhitespace** | [**boolean**] | Generate diffs that ignore whitespace. | (optional) defaults to undefined|
| **binary** | [**boolean**] | Generate diffs that include binary files, true if omitted. | (optional) defaults to undefined|
| **renames** | [**boolean**] | Whether to perform rename detection, true if omitted. | (optional) defaults to undefined|
| **merge** | [**boolean**] | This parameter is deprecated. The \&#39;topic\&#39; parameter should be used instead. The \&#39;merge\&#39; and \&#39;topic\&#39; parameters cannot be both used at the same time.  If true, the source commit is merged into the destination commit, and then a diff from the destination to the merge result is returned. If false, a simple \&#39;two dot\&#39; diff between the source and destination is returned. True if omitted. | (optional) defaults to undefined|
| **topic** | [**boolean**] | If true, returns 2-way \&#39;three-dot\&#39; diff. This is a diff between the source commit and the merge base of the source commit and the destination commit. If false, a simple \&#39;two dot\&#39; diff between the source and destination is returned.  If omitted, defaults to true, ie. a 2 way \&#39;three-dot\&#39; diff is returned.  | (optional) defaults to undefined|


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
|**200** | The raw diff |  -  |
|**555** | If the diff was too large and timed out.  Since this endpoint does not employ any form of pagination, but instead returns the diff as a single document, it can run into trouble on very large diffs. If Bitbucket times out in cases like these, a 555 status code is returned. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugDiffstatSpecGet**
> PaginatedDiffstats repositoriesWorkspaceRepoSlugDiffstatSpecGet()

Produces a response in JSON format with a record for every path modified, including information on the type of the change and the number of lines added and removed.  #### Single commit spec  If the `spec` argument to this API is a single commit, the diff is produced against the first parent of the specified commit.  #### Two commit spec  Two commits separated by `..` may be provided as the `spec`, e.g., `3a8b42..9ff173`. When two commits are provided and the `topic` query parameter is true, this API produces a 2-way three dot diff. This is the diff between source commit and the merge base of the source commit and the destination commit. When the `topic` query param is false, a simple git-style diff is produced.  The two commits are interpreted as follows:  * First commit: the commit containing the changes we wish to preview * Second commit: the commit representing the state to which we want to   compare the first commit * **Note**: This is the opposite of the order used in `git diff`.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let spec: string; //A commit SHA (e.g. `3a8b42`) or a commit range using double dot notation (e.g. `3a8b42..9ff173`).  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)
let ignoreWhitespace: boolean; //Generate diffs that ignore whitespace (optional) (default to undefined)
let merge: boolean; //This parameter is deprecated. The \'topic\' parameter should be used instead. The \'merge\' and \'topic\' parameters cannot be both used at the same time.  If true, the source commit is merged into the destination commit, and then a diffstat from the destination to the merge result is returned. If false, a simple \'two dot\' diffstat between the source and destination is returned. True if omitted. (optional) (default to undefined)
let path: string; //Limit the diffstat to a particular file (this parameter can be repeated for multiple paths). (optional) (default to undefined)
let renames: boolean; //Whether to perform rename detection, true if omitted. (optional) (default to undefined)
let topic: boolean; //If true, returns 2-way \'three-dot\' diff. This is a diff between the source commit and the merge base of the source commit and the destination commit. If false, a simple \'two dot\' diff between the source and destination is returned. (optional) (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugDiffstatSpecGet(
    repoSlug,
    spec,
    workspace,
    ignoreWhitespace,
    merge,
    path,
    renames,
    topic
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **spec** | [**string**] | A commit SHA (e.g. &#x60;3a8b42&#x60;) or a commit range using double dot notation (e.g. &#x60;3a8b42..9ff173&#x60;).  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|
| **ignoreWhitespace** | [**boolean**] | Generate diffs that ignore whitespace | (optional) defaults to undefined|
| **merge** | [**boolean**] | This parameter is deprecated. The \&#39;topic\&#39; parameter should be used instead. The \&#39;merge\&#39; and \&#39;topic\&#39; parameters cannot be both used at the same time.  If true, the source commit is merged into the destination commit, and then a diffstat from the destination to the merge result is returned. If false, a simple \&#39;two dot\&#39; diffstat between the source and destination is returned. True if omitted. | (optional) defaults to undefined|
| **path** | [**string**] | Limit the diffstat to a particular file (this parameter can be repeated for multiple paths). | (optional) defaults to undefined|
| **renames** | [**boolean**] | Whether to perform rename detection, true if omitted. | (optional) defaults to undefined|
| **topic** | [**boolean**] | If true, returns 2-way \&#39;three-dot\&#39; diff. This is a diff between the source commit and the merge base of the source commit and the destination commit. If false, a simple \&#39;two dot\&#39; diff between the source and destination is returned. | (optional) defaults to undefined|


### Return type

**PaginatedDiffstats**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The diff stats |  -  |
|**555** | If generating the diffstat timed out. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugFileConflictsSpecGet**
> PaginatedFileConflicts repositoriesWorkspaceRepoSlugFileConflictsSpecGet()

Get file conflicts for a commit spec

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let spec: string; //A commit SHA (e.g. `3a8b42`) or a commit range using double dot notation (e.g. `3a8b42..9ff173`).  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugFileConflictsSpecGet(
    repoSlug,
    spec,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **spec** | [**string**] | A commit SHA (e.g. &#x60;3a8b42&#x60;) or a commit range using double dot notation (e.g. &#x60;3a8b42..9ff173&#x60;).  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**PaginatedFileConflicts**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A paginated list of file conflicts |  -  |
|**404** | If the spec cannot be resolved, which may be due to an invalid spec, or commits/refs not present in the repository |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugMergeBaseRevspecGet**
> Commit repositoriesWorkspaceRepoSlugMergeBaseRevspecGet()

Returns the best common ancestor between two commits, specified in a revspec of 2 commits (e.g. 3a8b42..9ff173).  If more than one best common ancestor exists, only one will be returned. It is unspecified which will be returned.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let revspec: string; //A commit range using double dot notation (e.g. `3a8b42..9ff173`).  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugMergeBaseRevspecGet(
    repoSlug,
    revspec,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **revspec** | [**string**] | A commit range using double dot notation (e.g. &#x60;3a8b42..9ff173&#x60;).  | defaults to undefined|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: &#x60;{workspace UUID}&#x60;.  | defaults to undefined|


### Return type

**Commit**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The merge base of the provided spec. |  -  |
|**401** | If the request was not authenticated. |  -  |
|**403** | If the authenticated user does not have access to any of the repositories specified. |  -  |
|**404** | If the repository or ref in the spec does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **repositoriesWorkspaceRepoSlugPatchSpecGet**
> repositoriesWorkspaceRepoSlugPatchSpecGet()

Produces a raw patch for a single commit (diffed against its first parent), or a patch-series for a revspec of 2 commits (e.g. `3a8b42..9ff173` where the first commit represents the source and the second commit the destination).  In case of the latter (diffing a revspec), a patch series is returned for the commits on the source branch (`3a8b42` and its ancestors in our example).  While similar to diffs, patches:  * Have a commit header (username, commit message, etc) * Do not support the `path=foo/bar.py` query parameter  The raw patch is returned as-is, in whatever encoding the files in the repository use. It is not decoded into unicode. As such, the content-type is `text/plain`.

### Example

```typescript
import {
    CommitsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new CommitsApi(configuration);

let repoSlug: string; //This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: `{repository UUID}`.  (default to undefined)
let spec: string; //A commit SHA (e.g. `3a8b42`) or a commit range using double dot notation (e.g. `3a8b42..9ff173`).  (default to undefined)
let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example: `{workspace UUID}`.  (default to undefined)

const { status, data } = await apiInstance.repositoriesWorkspaceRepoSlugPatchSpecGet(
    repoSlug,
    spec,
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **repoSlug** | [**string**] | This can either be the repository slug or the UUID of the repository, surrounded by curly-braces, for example: &#x60;{repository UUID}&#x60;.  | defaults to undefined|
| **spec** | [**string**] | A commit SHA (e.g. &#x60;3a8b42&#x60;) or a commit range using double dot notation (e.g. &#x60;3a8b42..9ff173&#x60;).  | defaults to undefined|
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
|**200** | The raw patches |  -  |
|**555** | If the diff was too large and timed out.  Since this endpoint does not employ any form of pagination, but instead returns the diff as a single document, it can run into trouble on very large diffs. If Bitbucket times out in cases like these, a 555 status code is returned. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

