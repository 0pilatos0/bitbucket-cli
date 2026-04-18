# PipelinesApi

All URIs are relative to *https://api.bitbucket.org/2.0*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createDeploymentVariable**](#createdeploymentvariable) | **POST** /repositories/{workspace}/{repo_slug}/deployments_config/environments/{environment_uuid}/variables | Create a variable for an environment|
|[**createPipelineForRepository**](#createpipelineforrepository) | **POST** /repositories/{workspace}/{repo_slug}/pipelines | Run a pipeline|
|[**createPipelineVariableForTeam**](#createpipelinevariableforteam) | **POST** /teams/{username}/pipelines_config/variables | Create a variable for a user|
|[**createPipelineVariableForUser**](#createpipelinevariableforuser) | **POST** /users/{selected_user}/pipelines_config/variables | Create a variable for a user|
|[**createPipelineVariableForWorkspace**](#createpipelinevariableforworkspace) | **POST** /workspaces/{workspace}/pipelines-config/variables | Create a variable for a workspace|
|[**createRepositoryPipelineKnownHost**](#createrepositorypipelineknownhost) | **POST** /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts | Create a known host|
|[**createRepositoryPipelineSchedule**](#createrepositorypipelineschedule) | **POST** /repositories/{workspace}/{repo_slug}/pipelines_config/schedules | Create a schedule|
|[**createRepositoryPipelineVariable**](#createrepositorypipelinevariable) | **POST** /repositories/{workspace}/{repo_slug}/pipelines_config/variables | Create a variable for a repository|
|[**createRepositoryRunner**](#createrepositoryrunner) | **POST** /repositories/{workspace}/{repo_slug}/pipelines-config/runners | Create repository runner|
|[**createWorkspaceRunner**](#createworkspacerunner) | **POST** /workspaces/{workspace}/pipelines-config/runners | Create workspace runner|
|[**deleteDeploymentVariable**](#deletedeploymentvariable) | **DELETE** /repositories/{workspace}/{repo_slug}/deployments_config/environments/{environment_uuid}/variables/{variable_uuid} | Delete a variable for an environment|
|[**deletePipelineVariableForTeam**](#deletepipelinevariableforteam) | **DELETE** /teams/{username}/pipelines_config/variables/{variable_uuid} | Delete a variable for a team|
|[**deletePipelineVariableForUser**](#deletepipelinevariableforuser) | **DELETE** /users/{selected_user}/pipelines_config/variables/{variable_uuid} | Delete a variable for a user|
|[**deletePipelineVariableForWorkspace**](#deletepipelinevariableforworkspace) | **DELETE** /workspaces/{workspace}/pipelines-config/variables/{variable_uuid} | Delete a variable for a workspace|
|[**deleteRepositoryPipelineCache**](#deleterepositorypipelinecache) | **DELETE** /repositories/{workspace}/{repo_slug}/pipelines-config/caches/{cache_uuid} | Delete a cache|
|[**deleteRepositoryPipelineCaches**](#deleterepositorypipelinecaches) | **DELETE** /repositories/{workspace}/{repo_slug}/pipelines-config/caches | Delete caches|
|[**deleteRepositoryPipelineKeyPair**](#deleterepositorypipelinekeypair) | **DELETE** /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/key_pair | Delete SSH key pair|
|[**deleteRepositoryPipelineKnownHost**](#deleterepositorypipelineknownhost) | **DELETE** /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts/{known_host_uuid} | Delete a known host|
|[**deleteRepositoryPipelineSchedule**](#deleterepositorypipelineschedule) | **DELETE** /repositories/{workspace}/{repo_slug}/pipelines_config/schedules/{schedule_uuid} | Delete a schedule|
|[**deleteRepositoryPipelineVariable**](#deleterepositorypipelinevariable) | **DELETE** /repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid} | Delete a variable for a repository|
|[**deleteRepositoryRunner**](#deleterepositoryrunner) | **DELETE** /repositories/{workspace}/{repo_slug}/pipelines-config/runners/{runner_uuid} | Delete repository runner|
|[**deleteWorkspaceRunner**](#deleteworkspacerunner) | **DELETE** /workspaces/{workspace}/pipelines-config/runners/{runner_uuid} | Delete workspace runner|
|[**getDeploymentVariables**](#getdeploymentvariables) | **GET** /repositories/{workspace}/{repo_slug}/deployments_config/environments/{environment_uuid}/variables | List variables for an environment|
|[**getOIDCConfiguration**](#getoidcconfiguration) | **GET** /workspaces/{workspace}/pipelines-config/identity/oidc/.well-known/openid-configuration | Get OpenID configuration for OIDC in Pipelines|
|[**getOIDCKeys**](#getoidckeys) | **GET** /workspaces/{workspace}/pipelines-config/identity/oidc/keys.json | Get keys for OIDC in Pipelines|
|[**getPipelineContainerLog**](#getpipelinecontainerlog) | **GET** /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/logs/{log_uuid} | Get the logs for the build container or a service container for a given step of a pipeline.|
|[**getPipelineForRepository**](#getpipelineforrepository) | **GET** /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid} | Get a pipeline|
|[**getPipelineStepForRepository**](#getpipelinestepforrepository) | **GET** /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid} | Get a step of a pipeline|
|[**getPipelineStepLogForRepository**](#getpipelinesteplogforrepository) | **GET** /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/log | Get log file for a step|
|[**getPipelineStepsForRepository**](#getpipelinestepsforrepository) | **GET** /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps | List steps for a pipeline|
|[**getPipelineTestReportTestCaseReasons**](#getpipelinetestreporttestcasereasons) | **GET** /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/test_reports/test_cases/{test_case_uuid}/test_case_reasons | Get test case reasons (output) for a given test case in a step of a pipeline.|
|[**getPipelineTestReportTestCases**](#getpipelinetestreporttestcases) | **GET** /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/test_reports/test_cases | Get test cases for a given step of a pipeline.|
|[**getPipelineTestReports**](#getpipelinetestreports) | **GET** /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps/{step_uuid}/test_reports | Get a summary of test reports for a given step of a pipeline.|
|[**getPipelineVariableForTeam**](#getpipelinevariableforteam) | **GET** /teams/{username}/pipelines_config/variables/{variable_uuid} | Get a variable for a team|
|[**getPipelineVariableForUser**](#getpipelinevariableforuser) | **GET** /users/{selected_user}/pipelines_config/variables/{variable_uuid} | Get a variable for a user|
|[**getPipelineVariableForWorkspace**](#getpipelinevariableforworkspace) | **GET** /workspaces/{workspace}/pipelines-config/variables/{variable_uuid} | Get variable for a workspace|
|[**getPipelineVariablesForTeam**](#getpipelinevariablesforteam) | **GET** /teams/{username}/pipelines_config/variables | List variables for an account|
|[**getPipelineVariablesForUser**](#getpipelinevariablesforuser) | **GET** /users/{selected_user}/pipelines_config/variables | List variables for a user|
|[**getPipelineVariablesForWorkspace**](#getpipelinevariablesforworkspace) | **GET** /workspaces/{workspace}/pipelines-config/variables | List variables for a workspace|
|[**getPipelinesForRepository**](#getpipelinesforrepository) | **GET** /repositories/{workspace}/{repo_slug}/pipelines | List pipelines|
|[**getRepositoryPipelineCacheContentURI**](#getrepositorypipelinecachecontenturi) | **GET** /repositories/{workspace}/{repo_slug}/pipelines-config/caches/{cache_uuid}/content-uri | Get cache content URI|
|[**getRepositoryPipelineCaches**](#getrepositorypipelinecaches) | **GET** /repositories/{workspace}/{repo_slug}/pipelines-config/caches | List caches|
|[**getRepositoryPipelineConfig**](#getrepositorypipelineconfig) | **GET** /repositories/{workspace}/{repo_slug}/pipelines_config | Get configuration|
|[**getRepositoryPipelineKnownHost**](#getrepositorypipelineknownhost) | **GET** /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts/{known_host_uuid} | Get a known host|
|[**getRepositoryPipelineKnownHosts**](#getrepositorypipelineknownhosts) | **GET** /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts | List known hosts|
|[**getRepositoryPipelineSchedule**](#getrepositorypipelineschedule) | **GET** /repositories/{workspace}/{repo_slug}/pipelines_config/schedules/{schedule_uuid} | Get a schedule|
|[**getRepositoryPipelineScheduleExecutions**](#getrepositorypipelinescheduleexecutions) | **GET** /repositories/{workspace}/{repo_slug}/pipelines_config/schedules/{schedule_uuid}/executions | List executions of a schedule|
|[**getRepositoryPipelineSchedules**](#getrepositorypipelineschedules) | **GET** /repositories/{workspace}/{repo_slug}/pipelines_config/schedules | List schedules|
|[**getRepositoryPipelineSshKeyPair**](#getrepositorypipelinesshkeypair) | **GET** /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/key_pair | Get SSH key pair|
|[**getRepositoryPipelineVariable**](#getrepositorypipelinevariable) | **GET** /repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid} | Get a variable for a repository|
|[**getRepositoryPipelineVariables**](#getrepositorypipelinevariables) | **GET** /repositories/{workspace}/{repo_slug}/pipelines_config/variables | List variables for a repository|
|[**getRepositoryRunner**](#getrepositoryrunner) | **GET** /repositories/{workspace}/{repo_slug}/pipelines-config/runners/{runner_uuid} | Get repository runner|
|[**getRepositoryRunners**](#getrepositoryrunners) | **GET** /repositories/{workspace}/{repo_slug}/pipelines-config/runners | Get repository runners|
|[**getWorkspaceRunner**](#getworkspacerunner) | **GET** /workspaces/{workspace}/pipelines-config/runners/{runner_uuid} | Get workspace runner|
|[**getWorkspaceRunners**](#getworkspacerunners) | **GET** /workspaces/{workspace}/pipelines-config/runners | Get workspace runners|
|[**stopPipeline**](#stoppipeline) | **POST** /repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/stopPipeline | Stop a pipeline|
|[**updateDeploymentVariable**](#updatedeploymentvariable) | **PUT** /repositories/{workspace}/{repo_slug}/deployments_config/environments/{environment_uuid}/variables/{variable_uuid} | Update a variable for an environment|
|[**updatePipelineVariableForTeam**](#updatepipelinevariableforteam) | **PUT** /teams/{username}/pipelines_config/variables/{variable_uuid} | Update a variable for a team|
|[**updatePipelineVariableForUser**](#updatepipelinevariableforuser) | **PUT** /users/{selected_user}/pipelines_config/variables/{variable_uuid} | Update a variable for a user|
|[**updatePipelineVariableForWorkspace**](#updatepipelinevariableforworkspace) | **PUT** /workspaces/{workspace}/pipelines-config/variables/{variable_uuid} | Update variable for a workspace|
|[**updateRepositoryBuildNumber**](#updaterepositorybuildnumber) | **PUT** /repositories/{workspace}/{repo_slug}/pipelines_config/build_number | Update the next build number|
|[**updateRepositoryPipelineConfig**](#updaterepositorypipelineconfig) | **PUT** /repositories/{workspace}/{repo_slug}/pipelines_config | Update configuration|
|[**updateRepositoryPipelineKeyPair**](#updaterepositorypipelinekeypair) | **PUT** /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/key_pair | Update SSH key pair|
|[**updateRepositoryPipelineKnownHost**](#updaterepositorypipelineknownhost) | **PUT** /repositories/{workspace}/{repo_slug}/pipelines_config/ssh/known_hosts/{known_host_uuid} | Update a known host|
|[**updateRepositoryPipelineSchedule**](#updaterepositorypipelineschedule) | **PUT** /repositories/{workspace}/{repo_slug}/pipelines_config/schedules/{schedule_uuid} | Update a schedule|
|[**updateRepositoryPipelineVariable**](#updaterepositorypipelinevariable) | **PUT** /repositories/{workspace}/{repo_slug}/pipelines_config/variables/{variable_uuid} | Update a variable for a repository|
|[**updateRepositoryRunner**](#updaterepositoryrunner) | **PUT** /repositories/{workspace}/{repo_slug}/pipelines-config/runners/{runner_uuid} | Update repository runner|
|[**updateWorkspaceRunner**](#updateworkspacerunner) | **PUT** /workspaces/{workspace}/pipelines-config/runners/{runner_uuid} | Update workspace runner|

# **createDeploymentVariable**
> DeploymentVariable createDeploymentVariable(deploymentVariable)

Create a deployment environment level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    DeploymentVariable
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let environmentUuid: string; //The environment. (default to undefined)
let deploymentVariable: DeploymentVariable; //The variable to create

const { status, data } = await apiInstance.createDeploymentVariable(
    workspace,
    repoSlug,
    environmentUuid,
    deploymentVariable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **deploymentVariable** | **DeploymentVariable**| The variable to create | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **environmentUuid** | [**string**] | The environment. | defaults to undefined|


### Return type

**DeploymentVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The variable was created. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**404** | The account, repository, environment or variable with the given UUID was not found. |  -  |
|**409** | A variable with the provided key already exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createPipelineForRepository**
> Pipeline createPipelineForRepository(pipeline)

Endpoint to create and initiate a pipeline. There are a number of different options to initiate a pipeline, where the payload of the request will determine which type of pipeline will be instantiated.  ## Trigger a pipeline for a branch  One way to trigger pipelines is by specifying the branch for which you want to trigger a pipeline. The specified branch will be used to determine which pipeline definition from the `bitbucket-pipelines.yml` file will be applied to initiate the pipeline. The pipeline will then do a clone of the repository and checkout the latest revision of the specified branch.  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/json\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines/ \\       -d \'       {         \"target\": {           \"ref_type\": \"branch\",           \"type\": \"pipeline_ref_target\",           \"ref_name\": \"master\"         }       }\' ```  ## Trigger a pipeline for a commit on a branch or tag  You can initiate a pipeline for a specific commit and in the context of a specified reference (e.g. a branch, tag or bookmark). The specified reference will be used to determine which pipeline definition from the bitbucket-pipelines.yml file will be applied to initiate the pipeline. The pipeline will clone the repository and then do a checkout the specified reference.  The following reference types are supported:  * `branch` * `named_branch` * `bookmark`  * `tag`  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/json\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines/ \\       -d \'       {         \"target\": {           \"commit\": {             \"type\": \"commit\",             \"hash\": \"ce5b7431602f7cbba007062eeb55225c6e18e956\"           },           \"ref_type\": \"branch\",           \"type\": \"pipeline_ref_target\",           \"ref_name\": \"master\"         }       }\' ```  ## Trigger a specific pipeline definition for a commit  You can trigger a specific pipeline that is defined in your `bitbucket-pipelines.yml` file for a specific commit. In addition to the commit revision, you specify the type and pattern of the selector that identifies the pipeline definition. The resulting pipeline will then clone the repository and checkout the specified revision.  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/json\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines/ \\       -d \'       {         \"target\": {           \"commit\": {             \"hash\":\"a3c4e02c9a3755eccdc3764e6ea13facdf30f923\",             \"type\":\"commit\"           },           \"selector\": {             \"type\":\"custom\",             \"pattern\":\"Deploy to production\"           },           \"type\":\"pipeline_commit_target\"         }       }\' ```  ## Trigger a specific pipeline definition for a commit on a branch or tag  You can trigger a specific pipeline that is defined in your `bitbucket-pipelines.yml` file for a specific commit in the context of a specified reference. In addition to the commit revision, you specify the type and pattern of the selector that identifies the pipeline definition, as well as the reference information. The resulting pipeline will then clone the repository a checkout the specified reference.  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/json\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines/ \\       -d \'       {         \"target\": {           \"commit\": {             \"hash\":\"a3c4e02c9a3755eccdc3764e6ea13facdf30f923\",             \"type\":\"commit\"           },           \"selector\": {             \"type\": \"custom\",             \"pattern\": \"Deploy to production\"           },           \"type\": \"pipeline_ref_target\",           \"ref_name\": \"master\",           \"ref_type\": \"branch\"         }       }\' ```  ## Trigger a custom pipeline with variables  In addition to triggering a custom pipeline that is defined in your `bitbucket-pipelines.yml` file as shown in the examples above, you can specify variables that will be available for your build. In the request, provide a list of variables, specifying the following for each variable: key, value, and whether it should be secured or not (this field is optional and defaults to not secured).  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/json\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines/ \\       -d \'       {         \"target\": {           \"type\": \"pipeline_ref_target\",           \"ref_type\": \"branch\",           \"ref_name\": \"master\",           \"selector\": {             \"type\": \"custom\",             \"pattern\": \"Deploy to production\"           }         },         \"variables\": [           {             \"key\": \"var1key\",             \"value\": \"var1value\",             \"secured\": true           },           {             \"key\": \"var2key\",             \"value\": \"var2value\"           }         ]       }\' ```  ## Trigger a pull request pipeline  You can also initiate a pipeline for a specific pull request.  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/json\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines/ \\       -d \'       {         \"target\": {           \"type\": \"pipeline_pullrequest_target\",           \"source\": \"pull-request-branch\",           \"destination\": \"master\",           \"destination_commit\": {             \"hash\": \"9f848b7\"           },           \"commit\": {             \"hash\": \"1a372fc\"           },           \"pullrequest\": {             \"id\": \"3\"           },           \"selector\": {             \"type\": \"pull-requests\",             \"pattern\": \"**\"           }         }       }\' ```  # On-demand pipeline  By default, pipelines run using the YAML in the repository’s `bitbucket-pipelines.yml` configuration file. With an _on-demand_ pipeline, you include the pipeline’s YAML in the request body. That YAML applies only to that run and overrides the YAML in `bitbucket-pipelines.yml`.  Just like with regular pipelines, there is a number of different options to initiate an on-demand pipeline. However, since the payload contains YAML configuration in this case, _query parameters_ are used to supply the necessary metadata to determine which type of pipeline will be instantiated. These query parameters are derived from the JSON equivalent by turning each property into a key-value pair with the JSON path of the property as the new key.  ## Trigger on-demand pipeline for a branch  You can initiate an on-demand pipeline for a specific branch. This branch will be used to determine which pipeline definition from the supplied YAML configuration will be applied to initiate the pipeline. The pipeline will then do a clone of the repository and check out the latest revision of the specified branch.  To trigger an on-demand pipeline for a _branch_ the requesting user must have **write permission** for that branch (which can be limited by [branch restrictions](https://support.atlassian.com/bitbucket-cloud/docs/use-branch-permissions/)).  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/yaml\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines?target.type=pipeline_ref_target&target.ref_type=branch&target.ref_name=master \\       -d \' pipelines:   default:     - step:         script:           - echo This is an on-demand pipeline\' ```  ## Trigger on-demand pipeline for a commit on a branch or tag  You can initiate an on-demand pipeline for a specific commit and in the context of a specified reference (branch or tag). The specified reference will be used to determine which pipeline definition from the supplied YAML configuration will be applied to initiate the pipeline. The pipeline will clone the repository and check out the specified reference.  To trigger an on-demand pipeline for a _branch_ the requesting user must have **write permission** for that branch (which can be limited by [branch restrictions](https://support.atlassian.com/bitbucket-cloud/docs/use-branch-permissions/)).  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/yaml\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines?target.type=pipeline_ref_target&target.ref_type=branch&target.ref_name=master&target.commit.hash=ce5b7431602f7cbba007062eeb55225c6e18e956 \\       -d \' pipelines:   default:     - step:         script:           - echo This is an on-demand pipeline\' ```  ## Trigger a specific on-demand pipeline definition for a commit  You can trigger a specific pipeline that is defined in the supplied YAML configuration for a specific commit. In addition to the commit revision, you specify the type and pattern of the selector that identifies the pipeline definition. The resulting pipeline will then clone the repository and checkout the specified revision.  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/yaml\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines?target.type=pipeline_commit_target&target.commit.hash=a3c4e02c9a3755eccdc3764e6ea13facdf30f923&target.selector.type=custom&target.selector.pattern=security-scan \\       -d \' pipelines:   custom:     security-scan:       - step:           script:             - echo Run on-demand security scan ```  ## Trigger a custom on-demand pipeline with variables  In addition to triggering a custom on-demand pipeline that is defined in the supplied YAML configuration as shown in the examples above, you can specify variables that will be available for your build. In the request, provide each variable as an indexed set of query parameters representing its key, value, and whether it should be secured or not (this field is optional and defaults to not secured).  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/yaml\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines?target.type=pipeline_ref_target&target.ref_type=branch&target.ref_name=master&target.selector.type=custom&target.selector.pattern=security-scan&variables[0].key=var1key&variables[0].value=var1value&variables[0].secured=true&variables[1].key=var2key&variables[1].value=var2value \\       -d \' pipelines:   custom:     security-scan:       - variables:           - name: var1key           - name: var2key       - step:           script:             - echo Run on-demand security scan\' ```  ## Trigger a pull request pipeline  You can also initiate an on-demand pipeline for a specific pull request.  ### Example  ``` $ curl -X POST -is -u \'{atlassian_account_email}:{api_token}\' \\       -H \'Content-Type: application/yaml\' \\       https://api.bitbucket.org/2.0/repositories/{workspace}/{repo_slug}/pipelines?target.type=pipeline_pullrequest_target&target.source=pull-request-branch&target.destination=destination&target.destination_commit.hash=9f848b7&target.commit.hash=1a372fc&target.pullrequest.id=3&target.selector.type=pull-requests&target.selector.pattern=** \\       -d \' pipelines:   pull-requests:     \"**\":       - step:           script:             - echo This is an on-demand pipeline\' ``` 

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    Pipeline
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipeline: Pipeline; //The pipeline to initiate.

const { status, data } = await apiInstance.createPipelineForRepository(
    workspace,
    repoSlug,
    pipeline
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipeline** | **Pipeline**| The pipeline to initiate. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**Pipeline**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The initiated pipeline. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**400** | The account or repository is not enabled, the yml file does not exist in the repository for the given revision, or the request body contained invalid properties. |  -  |
|**404** | The account or repository was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createPipelineVariableForTeam**
> PipelineVariable createPipelineVariableForTeam()

Create an account level variable. This endpoint has been deprecated, and you should use the new workspaces endpoint. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineVariable
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let username: string; //The account. (default to undefined)
let pipelineVariable: PipelineVariable; //The variable to create. (optional)

const { status, data } = await apiInstance.createPipelineVariableForTeam(
    username,
    pipelineVariable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineVariable** | **PipelineVariable**| The variable to create. | |
| **username** | [**string**] | The account. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The created variable. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**404** | The account does not exist. |  -  |
|**409** | A variable with the provided key already exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createPipelineVariableForUser**
> PipelineVariable createPipelineVariableForUser()

Create a user level variable. This endpoint has been deprecated, and you should use the new workspaces endpoint. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineVariable
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let selectedUser: string; //Either the UUID of the account surrounded by curly-braces, for example `{account UUID}`, OR an Atlassian Account ID. (default to undefined)
let pipelineVariable: PipelineVariable; //The variable to create. (optional)

const { status, data } = await apiInstance.createPipelineVariableForUser(
    selectedUser,
    pipelineVariable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineVariable** | **PipelineVariable**| The variable to create. | |
| **selectedUser** | [**string**] | Either the UUID of the account surrounded by curly-braces, for example &#x60;{account UUID}&#x60;, OR an Atlassian Account ID. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The created variable. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**404** | The account does not exist. |  -  |
|**409** | A variable with the provided key already exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createPipelineVariableForWorkspace**
> PipelineVariable createPipelineVariableForWorkspace()

Create a workspace level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineVariable
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let pipelineVariable: PipelineVariable; //The variable to create. (optional)

const { status, data } = await apiInstance.createPipelineVariableForWorkspace(
    workspace,
    pipelineVariable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineVariable** | **PipelineVariable**| The variable to create. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The created variable. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**404** | The workspace does not exist. |  -  |
|**409** | A variable with the provided key already exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createRepositoryPipelineKnownHost**
> PipelineKnownHost createRepositoryPipelineKnownHost(pipelineKnownHost)

Create a repository level known host.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineKnownHost
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineKnownHost: PipelineKnownHost; //The known host to create.

const { status, data } = await apiInstance.createRepositoryPipelineKnownHost(
    workspace,
    repoSlug,
    pipelineKnownHost
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineKnownHost** | **PipelineKnownHost**| The known host to create. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PipelineKnownHost**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The known host was created. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**404** | The account or repository does not exist. |  -  |
|**409** | A known host with the provided hostname already exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createRepositoryPipelineSchedule**
> PipelineSchedule createRepositoryPipelineSchedule(pipelineSchedulePostRequestBody)

Create a schedule for the given repository.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineSchedulePostRequestBody
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineSchedulePostRequestBody: PipelineSchedulePostRequestBody; //The schedule to create.

const { status, data } = await apiInstance.createRepositoryPipelineSchedule(
    workspace,
    repoSlug,
    pipelineSchedulePostRequestBody
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineSchedulePostRequestBody** | **PipelineSchedulePostRequestBody**| The schedule to create. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PipelineSchedule**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The created schedule. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**400** | There were errors validating the request. |  -  |
|**401** | The maximum limit of schedules for this repository was reached. |  -  |
|**404** | The account or repository was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createRepositoryPipelineVariable**
> PipelineVariable createRepositoryPipelineVariable(pipelineVariable)

Create a repository level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineVariable
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineVariable: PipelineVariable; //The variable to create.

const { status, data } = await apiInstance.createRepositoryPipelineVariable(
    workspace,
    repoSlug,
    pipelineVariable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineVariable** | **PipelineVariable**| The variable to create. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | The variable was created. |  * Location - The location of the project. This header is only provided when the project key is updated. <br>  |
|**404** | The account or repository does not exist. |  -  |
|**409** | A variable with the provided key already exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createRepositoryRunner**
> PipelineRunner createRepositoryRunner()

Create repository runner.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.createRepositoryRunner(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PipelineRunner**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The repository runner. |  -  |
|**400** | The request body contained invalid properties or runner limit exceeded. |  -  |
|**409** | The repository runner with the provided UUID already exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createWorkspaceRunner**
> PipelineRunner createWorkspaceRunner()

Create workspace runner.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)

const { status, data } = await apiInstance.createWorkspaceRunner(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|


### Return type

**PipelineRunner**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The workspace runner. |  -  |
|**400** | The request body contained invalid properties or runner limit exceeded. |  -  |
|**409** | The workspace runner with the provided UUID already exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteDeploymentVariable**
> deleteDeploymentVariable()

Delete a deployment environment level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let environmentUuid: string; //The environment. (default to undefined)
let variableUuid: string; //The UUID of the variable to delete. (default to undefined)

const { status, data } = await apiInstance.deleteDeploymentVariable(
    workspace,
    repoSlug,
    environmentUuid,
    variableUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **environmentUuid** | [**string**] | The environment. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to delete. | defaults to undefined|


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
|**204** | The variable was deleted. |  -  |
|**404** | The account, repository, environment or variable with given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deletePipelineVariableForTeam**
> deletePipelineVariableForTeam()

Delete a team level variable. This endpoint has been deprecated, and you should use the new workspaces endpoint. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let username: string; //The account. (default to undefined)
let variableUuid: string; //The UUID of the variable to delete. (default to undefined)

const { status, data } = await apiInstance.deletePipelineVariableForTeam(
    username,
    variableUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **username** | [**string**] | The account. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to delete. | defaults to undefined|


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
|**204** | The variable was deleted |  -  |
|**404** | The account or the variable with the provided UUID does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deletePipelineVariableForUser**
> deletePipelineVariableForUser()

Delete an account level variable. This endpoint has been deprecated, and you should use the new workspaces endpoint. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let selectedUser: string; //Either the UUID of the account surrounded by curly-braces, for example `{account UUID}`, OR an Atlassian Account ID. (default to undefined)
let variableUuid: string; //The UUID of the variable to delete. (default to undefined)

const { status, data } = await apiInstance.deletePipelineVariableForUser(
    selectedUser,
    variableUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **selectedUser** | [**string**] | Either the UUID of the account surrounded by curly-braces, for example &#x60;{account UUID}&#x60;, OR an Atlassian Account ID. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to delete. | defaults to undefined|


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
|**204** | The variable was deleted |  -  |
|**404** | The account or the variable with the provided UUID does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deletePipelineVariableForWorkspace**
> deletePipelineVariableForWorkspace()

Delete a workspace level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let variableUuid: string; //The UUID of the variable to delete. (default to undefined)

const { status, data } = await apiInstance.deletePipelineVariableForWorkspace(
    workspace,
    variableUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to delete. | defaults to undefined|


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
|**204** | The variable was deleted |  -  |
|**404** | The workspace or the variable with the provided UUID does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRepositoryPipelineCache**
> deleteRepositoryPipelineCache()

Delete a repository cache.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //The account. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let cacheUuid: string; //The UUID of the cache to delete. (default to undefined)

const { status, data } = await apiInstance.deleteRepositoryPipelineCache(
    workspace,
    repoSlug,
    cacheUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The account. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **cacheUuid** | [**string**] | The UUID of the cache to delete. | defaults to undefined|


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
|**204** | The cache was deleted. |  -  |
|**404** | The workspace, repository or cache_uuid with given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRepositoryPipelineCaches**
> deleteRepositoryPipelineCaches()

Delete repository cache versions by name.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //The account. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let name: string; //The cache name. (default to undefined)

const { status, data } = await apiInstance.deleteRepositoryPipelineCaches(
    workspace,
    repoSlug,
    name
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The account. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **name** | [**string**] | The cache name. | defaults to undefined|


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
|**204** | The caches were deleted. |  -  |
|**404** | The workspace, repository or cache name was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRepositoryPipelineKeyPair**
> deleteRepositoryPipelineKeyPair()

Delete the repository SSH key pair.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.deleteRepositoryPipelineKeyPair(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


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
|**204** | The SSH key pair was deleted. |  -  |
|**404** | The account, repository or SSH key pair was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRepositoryPipelineKnownHost**
> deleteRepositoryPipelineKnownHost()

Delete a repository level known host.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let knownHostUuid: string; //The UUID of the known host to delete. (default to undefined)

const { status, data } = await apiInstance.deleteRepositoryPipelineKnownHost(
    workspace,
    repoSlug,
    knownHostUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **knownHostUuid** | [**string**] | The UUID of the known host to delete. | defaults to undefined|


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
|**204** | The known host was deleted. |  -  |
|**404** | The account, repository or known host with given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRepositoryPipelineSchedule**
> deleteRepositoryPipelineSchedule()

Delete a schedule.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let scheduleUuid: string; //The uuid of the schedule. (default to undefined)

const { status, data } = await apiInstance.deleteRepositoryPipelineSchedule(
    workspace,
    repoSlug,
    scheduleUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **scheduleUuid** | [**string**] | The uuid of the schedule. | defaults to undefined|


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
|**204** | The schedule was deleted. |  -  |
|**404** | The account, repository or schedule was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRepositoryPipelineVariable**
> deleteRepositoryPipelineVariable()

Delete a repository level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let variableUuid: string; //The UUID of the variable to delete. (default to undefined)

const { status, data } = await apiInstance.deleteRepositoryPipelineVariable(
    workspace,
    repoSlug,
    variableUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to delete. | defaults to undefined|


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
|**204** | The variable was deleted. |  -  |
|**404** | The account, repository or variable with given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRepositoryRunner**
> deleteRepositoryRunner()

Delete repository runner by uuid.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let runnerUuid: string; //The runner uuid. (default to undefined)

const { status, data } = await apiInstance.deleteRepositoryRunner(
    workspace,
    repoSlug,
    runnerUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **runnerUuid** | [**string**] | The runner uuid. | defaults to undefined|


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
|**204** | The repository runner was deleted. |  -  |
|**404** | The repository runner was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteWorkspaceRunner**
> deleteWorkspaceRunner()

Delete workspace runner by uuid.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let runnerUuid: string; //The runner uuid. (default to undefined)

const { status, data } = await apiInstance.deleteWorkspaceRunner(
    workspace,
    runnerUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **runnerUuid** | [**string**] | The runner uuid. | defaults to undefined|


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
|**204** | The workspace runner was deleted. |  -  |
|**404** | The workspace runner was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getDeploymentVariables**
> PaginatedDeploymentVariable getDeploymentVariables()

Find deployment environment level variables.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let environmentUuid: string; //The environment. (default to undefined)

const { status, data } = await apiInstance.getDeploymentVariables(
    workspace,
    repoSlug,
    environmentUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **environmentUuid** | [**string**] | The environment. | defaults to undefined|


### Return type

**PaginatedDeploymentVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The retrieved deployment variables. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getOIDCConfiguration**
> getOIDCConfiguration()

This is part of OpenID Connect for Pipelines, see https://support.atlassian.com/bitbucket-cloud/docs/integrate-pipelines-with-resource-servers-using-oidc/

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)

const { status, data } = await apiInstance.getOIDCConfiguration(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|


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
|**200** | The OpenID configuration |  -  |
|**404** | The workspace was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getOIDCKeys**
> getOIDCKeys()

This is part of OpenID Connect for Pipelines, see https://support.atlassian.com/bitbucket-cloud/docs/integrate-pipelines-with-resource-servers-using-oidc/

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)

const { status, data } = await apiInstance.getOIDCKeys(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|


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
|**200** | The keys in JSON web key format |  -  |
|**404** | The workspace was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineContainerLog**
> getPipelineContainerLog()

Retrieve the log file for a build container or service container.  This endpoint supports (and encourages!) the use of [HTTP Range requests](https://tools.ietf.org/html/rfc7233) to deal with potentially very large log files.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineUuid: string; //The UUID of the pipeline. (default to undefined)
let stepUuid: string; //The UUID of the step. (default to undefined)
let logUuid: string; //For the main build container specify the step UUID; for a service container specify the service container UUID (default to undefined)

const { status, data } = await apiInstance.getPipelineContainerLog(
    workspace,
    repoSlug,
    pipelineUuid,
    stepUuid,
    logUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pipelineUuid** | [**string**] | The UUID of the pipeline. | defaults to undefined|
| **stepUuid** | [**string**] | The UUID of the step. | defaults to undefined|
| **logUuid** | [**string**] | For the main build container specify the step UUID; for a service container specify the service container UUID | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The raw log file for the build container or service container. |  -  |
|**307** | After the step is completed, the log is moved to long term storage and a redirection to the log file is returned. |  -  |
|**404** | No account, repository, pipeline, step or log exist for the provided path. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineForRepository**
> Pipeline getPipelineForRepository()

Retrieve a specified pipeline

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineUuid: string; //The pipeline UUID. (default to undefined)

const { status, data } = await apiInstance.getPipelineForRepository(
    workspace,
    repoSlug,
    pipelineUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pipelineUuid** | [**string**] | The pipeline UUID. | defaults to undefined|


### Return type

**Pipeline**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The pipeline. |  -  |
|**404** | No account, repository or pipeline with the UUID provided exists. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineStepForRepository**
> PipelineStep getPipelineStepForRepository()

Retrieve a given step of a pipeline.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineUuid: string; //The UUID of the pipeline. (default to undefined)
let stepUuid: string; //The UUID of the step. (default to undefined)

const { status, data } = await apiInstance.getPipelineStepForRepository(
    workspace,
    repoSlug,
    pipelineUuid,
    stepUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pipelineUuid** | [**string**] | The UUID of the pipeline. | defaults to undefined|
| **stepUuid** | [**string**] | The UUID of the step. | defaults to undefined|


### Return type

**PipelineStep**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The step. |  -  |
|**404** | No account, repository, pipeline or step with the UUID provided exists for the pipeline with the UUID provided. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineStepLogForRepository**
> getPipelineStepLogForRepository()

Retrieve the log file for a given step of a pipeline.  This endpoint supports (and encourages!) the use of [HTTP Range requests](https://tools.ietf.org/html/rfc7233) to deal with potentially very large log files.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineUuid: string; //The UUID of the pipeline. (default to undefined)
let stepUuid: string; //The UUID of the step. (default to undefined)

const { status, data } = await apiInstance.getPipelineStepLogForRepository(
    workspace,
    repoSlug,
    pipelineUuid,
    stepUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pipelineUuid** | [**string**] | The UUID of the pipeline. | defaults to undefined|
| **stepUuid** | [**string**] | The UUID of the step. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The raw log file for this pipeline step. |  -  |
|**304** | The log has the same etag as the provided If-None-Match header. |  -  |
|**307** | After the step is completed, the log is moved to long term storage and a redirection to the log file is returned. |  -  |
|**404** | A pipeline with the given UUID does not exist, a step with the given UUID does not exist in the pipeline or a log file does not exist for the given step. |  -  |
|**416** | The requested range does not exist for requests that specified the [HTTP Range header](https://tools.ietf.org/html/rfc7233#section-3.1). |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineStepsForRepository**
> PaginatedPipelineSteps getPipelineStepsForRepository()

Find steps for the given pipeline.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineUuid: string; //The UUID of the pipeline. (default to undefined)

const { status, data } = await apiInstance.getPipelineStepsForRepository(
    workspace,
    repoSlug,
    pipelineUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pipelineUuid** | [**string**] | The UUID of the pipeline. | defaults to undefined|


### Return type

**PaginatedPipelineSteps**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The steps. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineTestReportTestCaseReasons**
> getPipelineTestReportTestCaseReasons()


### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineUuid: string; //The UUID of the pipeline. (default to undefined)
let stepUuid: string; //The UUID of the step. (default to undefined)
let testCaseUuid: string; //The UUID of the test case. (default to undefined)

const { status, data } = await apiInstance.getPipelineTestReportTestCaseReasons(
    workspace,
    repoSlug,
    pipelineUuid,
    stepUuid,
    testCaseUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pipelineUuid** | [**string**] | The UUID of the pipeline. | defaults to undefined|
| **stepUuid** | [**string**] | The UUID of the step. | defaults to undefined|
| **testCaseUuid** | [**string**] | The UUID of the test case. | defaults to undefined|


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
|**200** | Test case reasons (output). |  -  |
|**404** | No account, repository, pipeline, step or test case with the UUID provided exists for the pipeline with the UUID provided. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineTestReportTestCases**
> getPipelineTestReportTestCases()


### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineUuid: string; //The UUID of the pipeline. (default to undefined)
let stepUuid: string; //The UUID of the step. (default to undefined)

const { status, data } = await apiInstance.getPipelineTestReportTestCases(
    workspace,
    repoSlug,
    pipelineUuid,
    stepUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pipelineUuid** | [**string**] | The UUID of the pipeline. | defaults to undefined|
| **stepUuid** | [**string**] | The UUID of the step. | defaults to undefined|


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
|**200** | Test cases for this pipeline step. |  -  |
|**404** | No account, repository, pipeline, step or test reports exist for the provided path. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineTestReports**
> getPipelineTestReports()


### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineUuid: string; //The UUID of the pipeline. (default to undefined)
let stepUuid: string; //The UUID of the step. (default to undefined)

const { status, data } = await apiInstance.getPipelineTestReports(
    workspace,
    repoSlug,
    pipelineUuid,
    stepUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pipelineUuid** | [**string**] | The UUID of the pipeline. | defaults to undefined|
| **stepUuid** | [**string**] | The UUID of the step. | defaults to undefined|


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
|**200** | A summary of test reports for this pipeline step. |  -  |
|**404** | No account, repository, pipeline, step or test reports exist for the provided path. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineVariableForTeam**
> PipelineVariable getPipelineVariableForTeam()

Retrieve a team level variable. This endpoint has been deprecated, and you should use the new workspaces endpoint. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let username: string; //The account. (default to undefined)
let variableUuid: string; //The UUID of the variable to retrieve. (default to undefined)

const { status, data } = await apiInstance.getPipelineVariableForTeam(
    username,
    variableUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **username** | [**string**] | The account. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to retrieve. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The variable. |  -  |
|**404** | The account or variable with the given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineVariableForUser**
> PipelineVariable getPipelineVariableForUser()

Retrieve a user level variable. This endpoint has been deprecated, and you should use the new workspaces endpoint. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let selectedUser: string; //Either the UUID of the account surrounded by curly-braces, for example `{account UUID}`, OR an Atlassian Account ID. (default to undefined)
let variableUuid: string; //The UUID of the variable to retrieve. (default to undefined)

const { status, data } = await apiInstance.getPipelineVariableForUser(
    selectedUser,
    variableUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **selectedUser** | [**string**] | Either the UUID of the account surrounded by curly-braces, for example &#x60;{account UUID}&#x60;, OR an Atlassian Account ID. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to retrieve. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The variable. |  -  |
|**404** | The account or variable with the given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineVariableForWorkspace**
> PipelineVariable getPipelineVariableForWorkspace()

Retrieve a workspace level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let variableUuid: string; //The UUID of the variable to retrieve. (default to undefined)

const { status, data } = await apiInstance.getPipelineVariableForWorkspace(
    workspace,
    variableUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to retrieve. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The variable. |  -  |
|**404** | The workspace or variable with the given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineVariablesForTeam**
> PaginatedPipelineVariables getPipelineVariablesForTeam()

Find account level variables. This endpoint has been deprecated, and you should use the new workspaces endpoint. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let username: string; //The account. (default to undefined)

const { status, data } = await apiInstance.getPipelineVariablesForTeam(
    username
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **username** | [**string**] | The account. | defaults to undefined|


### Return type

**PaginatedPipelineVariables**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The found account level variables. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineVariablesForUser**
> PaginatedPipelineVariables getPipelineVariablesForUser()

Find user level variables. This endpoint has been deprecated, and you should use the new workspaces endpoint. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let selectedUser: string; //Either the UUID of the account surrounded by curly-braces, for example `{account UUID}`, OR an Atlassian Account ID. (default to undefined)

const { status, data } = await apiInstance.getPipelineVariablesForUser(
    selectedUser
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **selectedUser** | [**string**] | Either the UUID of the account surrounded by curly-braces, for example &#x60;{account UUID}&#x60;, OR an Atlassian Account ID. | defaults to undefined|


### Return type

**PaginatedPipelineVariables**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The found user level variables. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelineVariablesForWorkspace**
> PaginatedPipelineVariables getPipelineVariablesForWorkspace()

Find workspace level variables.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)

const { status, data } = await apiInstance.getPipelineVariablesForWorkspace(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|


### Return type

**PaginatedPipelineVariables**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The found workspace level variables. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPipelinesForRepository**
> PaginatedPipelines getPipelinesForRepository()

Find pipelines in a repository.  Note that unlike other endpoints in the Bitbucket API, this endpoint utilizes query parameters to allow filtering and sorting of returned results. See [query parameters](#api-repositories-workspace-repo-slug-pipelines-get-request-Query%20parameters) for specific details. 

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let creatorUuid: string; //The UUID of the creator of the pipeline to filter by. (optional) (default to undefined)
let targetRefType: 'BRANCH' | 'TAG' | 'ANNOTATED_TAG'; //The type of the reference to filter by. (optional) (default to undefined)
let targetRefName: string; //The reference name to filter by. (optional) (default to undefined)
let targetBranch: string; //The name of the branch to filter by. (optional) (default to undefined)
let targetCommitHash: string; //The revision to filter by. (optional) (default to undefined)
let targetSelectorPattern: string; //The pipeline pattern to filter by. (optional) (default to undefined)
let targetSelectorType: 'BRANCH' | 'TAG' | 'CUSTOM' | 'PULLREQUESTS' | 'DEFAULT'; //The type of pipeline to filter by. (optional) (default to undefined)
let createdOn: string; //The creation date to filter by. (optional) (default to undefined)
let triggerType: 'PUSH' | 'MANUAL' | 'SCHEDULED' | 'PARENT_STEP'; //The trigger type to filter by. (optional) (default to undefined)
let status: 'PARSING' | 'PENDING' | 'PAUSED' | 'HALTED' | 'BUILDING' | 'ERROR' | 'PASSED' | 'FAILED' | 'STOPPED' | 'UNKNOWN'; //The pipeline status to filter by. (optional) (default to undefined)
let sort: 'creator.uuid' | 'created_on' | 'run_creation_date'; //The attribute name to sort on. (optional) (default to undefined)
let page: number; //The page number of elements to retrieve. (optional) (default to 1)
let pagelen: number; //The maximum number of results to return. (optional) (default to 10)

const { status, data } = await apiInstance.getPipelinesForRepository(
    workspace,
    repoSlug,
    creatorUuid,
    targetRefType,
    targetRefName,
    targetBranch,
    targetCommitHash,
    targetSelectorPattern,
    targetSelectorType,
    createdOn,
    triggerType,
    status,
    sort,
    page,
    pagelen
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **creatorUuid** | [**string**] | The UUID of the creator of the pipeline to filter by. | (optional) defaults to undefined|
| **targetRefType** | [**&#39;BRANCH&#39; | &#39;TAG&#39; | &#39;ANNOTATED_TAG&#39;**]**Array<&#39;BRANCH&#39; &#124; &#39;TAG&#39; &#124; &#39;ANNOTATED_TAG&#39;>** | The type of the reference to filter by. | (optional) defaults to undefined|
| **targetRefName** | [**string**] | The reference name to filter by. | (optional) defaults to undefined|
| **targetBranch** | [**string**] | The name of the branch to filter by. | (optional) defaults to undefined|
| **targetCommitHash** | [**string**] | The revision to filter by. | (optional) defaults to undefined|
| **targetSelectorPattern** | [**string**] | The pipeline pattern to filter by. | (optional) defaults to undefined|
| **targetSelectorType** | [**&#39;BRANCH&#39; | &#39;TAG&#39; | &#39;CUSTOM&#39; | &#39;PULLREQUESTS&#39; | &#39;DEFAULT&#39;**]**Array<&#39;BRANCH&#39; &#124; &#39;TAG&#39; &#124; &#39;CUSTOM&#39; &#124; &#39;PULLREQUESTS&#39; &#124; &#39;DEFAULT&#39;>** | The type of pipeline to filter by. | (optional) defaults to undefined|
| **createdOn** | [**string**] | The creation date to filter by. | (optional) defaults to undefined|
| **triggerType** | [**&#39;PUSH&#39; | &#39;MANUAL&#39; | &#39;SCHEDULED&#39; | &#39;PARENT_STEP&#39;**]**Array<&#39;PUSH&#39; &#124; &#39;MANUAL&#39; &#124; &#39;SCHEDULED&#39; &#124; &#39;PARENT_STEP&#39;>** | The trigger type to filter by. | (optional) defaults to undefined|
| **status** | [**&#39;PARSING&#39; | &#39;PENDING&#39; | &#39;PAUSED&#39; | &#39;HALTED&#39; | &#39;BUILDING&#39; | &#39;ERROR&#39; | &#39;PASSED&#39; | &#39;FAILED&#39; | &#39;STOPPED&#39; | &#39;UNKNOWN&#39;**]**Array<&#39;PARSING&#39; &#124; &#39;PENDING&#39; &#124; &#39;PAUSED&#39; &#124; &#39;HALTED&#39; &#124; &#39;BUILDING&#39; &#124; &#39;ERROR&#39; &#124; &#39;PASSED&#39; &#124; &#39;FAILED&#39; &#124; &#39;STOPPED&#39; &#124; &#39;UNKNOWN&#39;>** | The pipeline status to filter by. | (optional) defaults to undefined|
| **sort** | [**&#39;creator.uuid&#39; | &#39;created_on&#39; | &#39;run_creation_date&#39;**]**Array<&#39;creator.uuid&#39; &#124; &#39;created_on&#39; &#124; &#39;run_creation_date&#39;>** | The attribute name to sort on. | (optional) defaults to undefined|
| **page** | [**number**] | The page number of elements to retrieve. | (optional) defaults to 1|
| **pagelen** | [**number**] | The maximum number of results to return. | (optional) defaults to 10|


### Return type

**PaginatedPipelines**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The matching pipelines. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineCacheContentURI**
> PipelineCacheContentUri getRepositoryPipelineCacheContentURI()

Retrieve the URI of the content of the specified cache.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //The account. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let cacheUuid: string; //The UUID of the cache. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineCacheContentURI(
    workspace,
    repoSlug,
    cacheUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The account. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **cacheUuid** | [**string**] | The UUID of the cache. | defaults to undefined|


### Return type

**PipelineCacheContentUri**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The cache content uri. |  -  |
|**404** | The workspace, repository or cache_uuid with given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineCaches**
> PaginatedPipelineCaches getRepositoryPipelineCaches()

Retrieve the repository pipelines caches.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //The account. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineCaches(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The account. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PaginatedPipelineCaches**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The list of caches for the given repository. |  -  |
|**404** | The account or repository was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineConfig**
> PipelinesConfig getRepositoryPipelineConfig()

Retrieve the repository pipelines configuration.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //The account. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineConfig(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | The account. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PipelinesConfig**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The repository pipelines configuration. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineKnownHost**
> PipelineKnownHost getRepositoryPipelineKnownHost()

Retrieve a repository level known host.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let knownHostUuid: string; //The UUID of the known host to retrieve. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineKnownHost(
    workspace,
    repoSlug,
    knownHostUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **knownHostUuid** | [**string**] | The UUID of the known host to retrieve. | defaults to undefined|


### Return type

**PipelineKnownHost**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The known host. |  -  |
|**404** | The account, repository or known host with the specified UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineKnownHosts**
> PaginatedPipelineKnownHosts getRepositoryPipelineKnownHosts()

Find repository level known hosts.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineKnownHosts(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PaginatedPipelineKnownHosts**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The retrieved known hosts. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineSchedule**
> PipelineSchedule getRepositoryPipelineSchedule()

Retrieve a schedule by its UUID.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let scheduleUuid: string; //The uuid of the schedule. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineSchedule(
    workspace,
    repoSlug,
    scheduleUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **scheduleUuid** | [**string**] | The uuid of the schedule. | defaults to undefined|


### Return type

**PipelineSchedule**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The requested schedule. |  -  |
|**404** | The account, repository or schedule was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineScheduleExecutions**
> PaginatedPipelineScheduleExecutions getRepositoryPipelineScheduleExecutions()

Retrieve the executions of a given schedule.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let scheduleUuid: string; //The uuid of the schedule. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineScheduleExecutions(
    workspace,
    repoSlug,
    scheduleUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **scheduleUuid** | [**string**] | The uuid of the schedule. | defaults to undefined|


### Return type

**PaginatedPipelineScheduleExecutions**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The list of executions of a schedule. |  -  |
|**404** | The account or repository was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineSchedules**
> PaginatedPipelineSchedules getRepositoryPipelineSchedules()

Retrieve the configured schedules for the given repository.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineSchedules(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PaginatedPipelineSchedules**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The list of schedules. |  -  |
|**404** | The account or repository was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineSshKeyPair**
> PipelineSshKeyPair getRepositoryPipelineSshKeyPair()

Retrieve the repository SSH key pair excluding the SSH private key. The private key is a write only field and will never be exposed in the logs or the REST API.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineSshKeyPair(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PipelineSshKeyPair**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The SSH key pair. |  -  |
|**404** | The account, repository or SSH key pair was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineVariable**
> PipelineVariable getRepositoryPipelineVariable()

Retrieve a repository level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let variableUuid: string; //The UUID of the variable to retrieve. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineVariable(
    workspace,
    repoSlug,
    variableUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to retrieve. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The variable. |  -  |
|**404** | The account, repository or variable with the specified UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryPipelineVariables**
> PaginatedPipelineVariables getRepositoryPipelineVariables()

Find repository level variables.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.getRepositoryPipelineVariables(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PaginatedPipelineVariables**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The retrieved variables. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryRunner**
> PipelineRunner getRepositoryRunner()

Retrieve repository runner by uuid.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let runnerUuid: string; //The runner uuid. (default to undefined)

const { status, data } = await apiInstance.getRepositoryRunner(
    workspace,
    repoSlug,
    runnerUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **runnerUuid** | [**string**] | The runner uuid. | defaults to undefined|


### Return type

**PipelineRunner**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The repository runner. |  -  |
|**404** | The repository runner was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositoryRunners**
> PaginatedPipelineRunners getRepositoryRunners()

Retrieve repository runners.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)

const { status, data } = await apiInstance.getRepositoryRunners(
    workspace,
    repoSlug
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PaginatedPipelineRunners**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The repository runners. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getWorkspaceRunner**
> PipelineRunner getWorkspaceRunner()

Get workspace runner by uuid.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let runnerUuid: string; //The runner uuid. (default to undefined)

const { status, data } = await apiInstance.getWorkspaceRunner(
    workspace,
    runnerUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **runnerUuid** | [**string**] | The runner uuid. | defaults to undefined|


### Return type

**PipelineRunner**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The workspace runner. |  -  |
|**404** | The workspace runner was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getWorkspaceRunners**
> PaginatedPipelineRunners getWorkspaceRunners()

Retrieve workspace runners.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)

const { status, data } = await apiInstance.getWorkspaceRunners(
    workspace
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|


### Return type

**PaginatedPipelineRunners**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The workspace runners. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **stopPipeline**
> stopPipeline()

Signal the stop of a pipeline and all of its steps that not have completed yet.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineUuid: string; //The UUID of the pipeline. (default to undefined)

const { status, data } = await apiInstance.stopPipeline(
    workspace,
    repoSlug,
    pipelineUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **pipelineUuid** | [**string**] | The UUID of the pipeline. | defaults to undefined|


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
|**204** | The pipeline has been signaled to stop. |  -  |
|**400** | The specified pipeline has already completed. |  -  |
|**404** | Either the account, repository or pipeline with the given UUID does not exist. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateDeploymentVariable**
> DeploymentVariable updateDeploymentVariable(deploymentVariable)

Update a deployment environment level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    DeploymentVariable
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let environmentUuid: string; //The environment. (default to undefined)
let variableUuid: string; //The UUID of the variable to update. (default to undefined)
let deploymentVariable: DeploymentVariable; //The updated deployment variable.

const { status, data } = await apiInstance.updateDeploymentVariable(
    workspace,
    repoSlug,
    environmentUuid,
    variableUuid,
    deploymentVariable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **deploymentVariable** | **DeploymentVariable**| The updated deployment variable. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **environmentUuid** | [**string**] | The environment. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to update. | defaults to undefined|


### Return type

**DeploymentVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The deployment variable was updated. |  -  |
|**404** | The account, repository, environment or variable with the given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updatePipelineVariableForTeam**
> PipelineVariable updatePipelineVariableForTeam(pipelineVariable)

Update a team level variable. This endpoint has been deprecated, and you should use the new workspaces endpoint. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineVariable
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let username: string; //The account. (default to undefined)
let variableUuid: string; //The UUID of the variable. (default to undefined)
let pipelineVariable: PipelineVariable; //The updated variable.

const { status, data } = await apiInstance.updatePipelineVariableForTeam(
    username,
    variableUuid,
    pipelineVariable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineVariable** | **PipelineVariable**| The updated variable. | |
| **username** | [**string**] | The account. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The variable was updated. |  -  |
|**404** | The account or the variable was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updatePipelineVariableForUser**
> PipelineVariable updatePipelineVariableForUser(pipelineVariable)

Update a user level variable. This endpoint has been deprecated, and you should use the new workspaces endpoint. For more information, see [the announcement](https://developer.atlassian.com/cloud/bitbucket/bitbucket-api-teams-deprecation/).

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineVariable
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let selectedUser: string; //Either the UUID of the account surrounded by curly-braces, for example `{account UUID}`, OR an Atlassian Account ID. (default to undefined)
let variableUuid: string; //The UUID of the variable. (default to undefined)
let pipelineVariable: PipelineVariable; //The updated variable.

const { status, data } = await apiInstance.updatePipelineVariableForUser(
    selectedUser,
    variableUuid,
    pipelineVariable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineVariable** | **PipelineVariable**| The updated variable. | |
| **selectedUser** | [**string**] | Either the UUID of the account surrounded by curly-braces, for example &#x60;{account UUID}&#x60;, OR an Atlassian Account ID. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The variable was updated. |  -  |
|**404** | The account or the variable was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updatePipelineVariableForWorkspace**
> PipelineVariable updatePipelineVariableForWorkspace(pipelineVariable)

Update a workspace level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineVariable
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let variableUuid: string; //The UUID of the variable. (default to undefined)
let pipelineVariable: PipelineVariable; //The updated variable.

const { status, data } = await apiInstance.updatePipelineVariableForWorkspace(
    workspace,
    variableUuid,
    pipelineVariable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineVariable** | **PipelineVariable**| The updated variable. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The variable was updated. |  -  |
|**404** | The workspace or the variable was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRepositoryBuildNumber**
> PipelineBuildNumber updateRepositoryBuildNumber(pipelineBuildNumber)

Update the next build number that should be assigned to a pipeline. The next build number that will be configured has to be strictly higher than the current latest build number for this repository.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineBuildNumber
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineBuildNumber: PipelineBuildNumber; //The build number to update.

const { status, data } = await apiInstance.updateRepositoryBuildNumber(
    workspace,
    repoSlug,
    pipelineBuildNumber
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineBuildNumber** | **PipelineBuildNumber**| The build number to update. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PipelineBuildNumber**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The build number has been configured. |  -  |
|**400** | The update failed because the next number was invalid (it should be higher than the current number). |  -  |
|**404** | The account or repository was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRepositoryPipelineConfig**
> PipelinesConfig updateRepositoryPipelineConfig(pipelinesConfig)

Update the pipelines configuration for a repository.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelinesConfig
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelinesConfig: PipelinesConfig; //The updated repository pipelines configuration.

const { status, data } = await apiInstance.updateRepositoryPipelineConfig(
    workspace,
    repoSlug,
    pipelinesConfig
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelinesConfig** | **PipelinesConfig**| The updated repository pipelines configuration. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PipelinesConfig**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The repository pipelines configuration was updated. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRepositoryPipelineKeyPair**
> PipelineSshKeyPair updateRepositoryPipelineKeyPair(pipelineSshKeyPair)

Create or update the repository SSH key pair. The private key will be set as a default SSH identity in your build container.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineSshKeyPair
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let pipelineSshKeyPair: PipelineSshKeyPair; //The created or updated SSH key pair.

const { status, data } = await apiInstance.updateRepositoryPipelineKeyPair(
    workspace,
    repoSlug,
    pipelineSshKeyPair
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineSshKeyPair** | **PipelineSshKeyPair**| The created or updated SSH key pair. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|


### Return type

**PipelineSshKeyPair**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The SSH key pair was created or updated. |  -  |
|**404** | The account, repository or SSH key pair was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRepositoryPipelineKnownHost**
> PipelineKnownHost updateRepositoryPipelineKnownHost(pipelineKnownHost)

Update a repository level known host.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineKnownHost
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let knownHostUuid: string; //The UUID of the known host to update. (default to undefined)
let pipelineKnownHost: PipelineKnownHost; //The updated known host.

const { status, data } = await apiInstance.updateRepositoryPipelineKnownHost(
    workspace,
    repoSlug,
    knownHostUuid,
    pipelineKnownHost
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineKnownHost** | **PipelineKnownHost**| The updated known host. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **knownHostUuid** | [**string**] | The UUID of the known host to update. | defaults to undefined|


### Return type

**PipelineKnownHost**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The known host was updated. |  -  |
|**404** | The account, repository or known host with the given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRepositoryPipelineSchedule**
> PipelineSchedule updateRepositoryPipelineSchedule(pipelineSchedulePutRequestBody)

Update a schedule.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineSchedulePutRequestBody
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let scheduleUuid: string; //The uuid of the schedule. (default to undefined)
let pipelineSchedulePutRequestBody: PipelineSchedulePutRequestBody; //The schedule to update.

const { status, data } = await apiInstance.updateRepositoryPipelineSchedule(
    workspace,
    repoSlug,
    scheduleUuid,
    pipelineSchedulePutRequestBody
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineSchedulePutRequestBody** | **PipelineSchedulePutRequestBody**| The schedule to update. | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **scheduleUuid** | [**string**] | The uuid of the schedule. | defaults to undefined|


### Return type

**PipelineSchedule**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The schedule is updated. |  -  |
|**404** | The account, repository or schedule was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRepositoryPipelineVariable**
> PipelineVariable updateRepositoryPipelineVariable(pipelineVariable)

Update a repository level variable.

### Example

```typescript
import {
    PipelinesApi,
    Configuration,
    PipelineVariable
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let variableUuid: string; //The UUID of the variable to update. (default to undefined)
let pipelineVariable: PipelineVariable; //The updated variable

const { status, data } = await apiInstance.updateRepositoryPipelineVariable(
    workspace,
    repoSlug,
    variableUuid,
    pipelineVariable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pipelineVariable** | **PipelineVariable**| The updated variable | |
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **variableUuid** | [**string**] | The UUID of the variable to update. | defaults to undefined|


### Return type

**PipelineVariable**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The variable was updated. |  -  |
|**404** | The account, repository or variable with the given UUID was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRepositoryRunner**
> PipelineRunner updateRepositoryRunner()

Update repository runner.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let repoSlug: string; //The repository. (default to undefined)
let runnerUuid: string; //The runner uuid. (default to undefined)

const { status, data } = await apiInstance.updateRepositoryRunner(
    workspace,
    repoSlug,
    runnerUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **repoSlug** | [**string**] | The repository. | defaults to undefined|
| **runnerUuid** | [**string**] | The runner uuid. | defaults to undefined|


### Return type

**PipelineRunner**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The repository runner. |  -  |
|**404** | The repository runner was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateWorkspaceRunner**
> PipelineRunner updateWorkspaceRunner()

Update workspace runner.

### Example

```typescript
import {
    PipelinesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PipelinesApi(configuration);

let workspace: string; //This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example `{workspace UUID}`. (default to undefined)
let runnerUuid: string; //The runner uuid. (default to undefined)

const { status, data } = await apiInstance.updateWorkspaceRunner(
    workspace,
    runnerUuid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspace** | [**string**] | This can either be the workspace ID (slug) or the workspace UUID surrounded by curly-braces, for example &#x60;{workspace UUID}&#x60;. | defaults to undefined|
| **runnerUuid** | [**string**] | The runner uuid. | defaults to undefined|


### Return type

**PipelineRunner**

### Authorization

[api_key](../README.md#api_key), [oauth2](../README.md#oauth2), [basic](../README.md#basic)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | The workspace runner. |  -  |
|**404** | The workspace runner was not found. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

