# ReportsApi

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

# **bulkCreateOrUpdateAnnotations**
> Array<ReportAnnotation> bulkCreateOrUpdateAnnotations(body)

Bulk upload of annotations. Annotations are individual findings that have been identified as part of a report, for example, a line of code that represents a vulnerability. These annotations can be attached to a specific file and even a specific line in that file, however, that is optional. Annotations are not mandatory and a report can contain up to 1000 annotations.  Add the annotations you want to upload as objects in a JSON array and make sure each annotation has the external_id field set to a unique value. If you want to use an existing id from your own system, we recommend prefixing it with your system\'s name to avoid collisions, for example, mySystem-annotation001. The external id can later be used to identify the report as an alternative to the generated [UUID](https://developer.atlassian.com/bitbucket/api/2/reference/meta/uri-uuid#uuid). You can upload up to 100 annotations per POST request.  ### Sample cURL request: ``` curl --location \'https://api.bitbucket.org/2.0/repositories/<username>/<reposity-name>/commit/<commit-hash>/reports/mysystem-001/annotations\' \\ --header \'Content-Type: application/json\' \\ --data-raw \'[   {         \"external_id\": \"mysystem-annotation001\",         \"title\": \"Security scan report\",         \"annotation_type\": \"VULNERABILITY\",         \"summary\": \"This line represents a security threat.\",         \"severity\": \"HIGH\",       \"path\": \"my-service/src/main/java/com/myCompany/mysystem/logic/Main.java\",         \"line\": 42   },   {         \"external_id\": \"mySystem-annotation002\",         \"title\": \"Bug report\",         \"annotation_type\": \"BUG\",         \"result\": \"FAILED\",         \"summary\": \"This line might introduce a bug.\",         \"severity\": \"MEDIUM\",       \"path\": \"my-service/src/main/java/com/myCompany/mysystem/logic/Helper.java\",         \"line\": 13   } ]\' ```  ### Possible field values: annotation_type: VULNERABILITY, CODE_SMELL, BUG result: PASSED, FAILED, IGNORED, SKIPPED severity: HIGH, MEDIUM, LOW, CRITICAL  Please refer to the [Code Insights documentation](https://confluence.atlassian.com/bitbucket/code-insights-994316785.html) for more information. 

### Example

```typescript
import {
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

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
    ReportsApi,
    Configuration,
    ReportAnnotation
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

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
    ReportsApi,
    Configuration,
    Report
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

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
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

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
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

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
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

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
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

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
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

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
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

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

