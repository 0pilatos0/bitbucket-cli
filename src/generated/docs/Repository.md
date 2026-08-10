# Repository


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**links** | **object** |  | [optional] [default to undefined]
**uuid** | **string** | The repository\&#39;s immutable id. This can be used as a substitute for the slug segment in URLs. Doing this guarantees your URLs will survive renaming of the repository by its owner, or even transfer of the repository to a different user. | [optional] [default to undefined]
**full_name** | **string** | The concatenation of the repository owner\&#39;s username and the slugified name, e.g. \&quot;evzijst/interruptingcow\&quot;. This is the same string used in Bitbucket URLs. | [optional] [default to undefined]
**is_private** | **boolean** |  | [optional] [default to undefined]
**parent** | [**Repository**](Repository.md) |  | [optional] [default to undefined]
**scm** | **string** |  | [optional] [default to undefined]
**owner** | [**Account**](Account.md) |  | [optional] [default to undefined]
**name** | **string** |  | [optional] [default to undefined]
**description** | **string** |  | [optional] [default to undefined]
**created_on** | **string** |  | [optional] [default to undefined]
**updated_on** | **string** |  | [optional] [default to undefined]
**size** | **number** |  | [optional] [default to undefined]
**language** | **string** |  | [optional] [default to undefined]
**has_issues** | **boolean** |  The issue tracker for this repository is enabled. Issue Tracker features are not supported for repositories in workspaces administered through admin.atlassian.com.  | [optional] [default to undefined]
**has_wiki** | **boolean** |  The wiki for this repository is enabled. Wiki features are not supported for repositories in workspaces administered through admin.atlassian.com.  | [optional] [default to undefined]
**fork_policy** | **string** |  Controls the rules for forking this repository.  * **allow_forks**: unrestricted forking * **no_public_forks**: restrict forking to private forks (forks cannot   be made public later) * **no_forks**: deny all forking  | [optional] [default to undefined]
**project** | [**Project**](Project.md) |  | [optional] [default to undefined]
**mainbranch** | [**Branch**](Branch.md) |  | [optional] [default to undefined]

## Example

```typescript
import { Repository } from './api';

const instance: Repository = {
    links,
    uuid,
    full_name,
    is_private,
    parent,
    scm,
    owner,
    name,
    description,
    created_on,
    updated_on,
    size,
    language,
    has_issues,
    has_wiki,
    fork_policy,
    project,
    mainbranch,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
