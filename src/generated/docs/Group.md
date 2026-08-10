# Group


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**links** | **object** |  | [optional] [default to undefined]
**owner** | [**Account**](Account.md) |  | [optional] [default to undefined]
**workspace** | [**Workspace**](Workspace.md) |  | [optional] [default to undefined]
**name** | **string** |  | [optional] [default to undefined]
**slug** | **string** | The \&quot;sluggified\&quot; version of the group\&#39;s name. This contains only ASCII characters and can therefore be slightly different than the name | [optional] [default to undefined]
**full_slug** | **string** | The concatenation of the workspace\&#39;s slug and the group\&#39;s slug, separated with a colon (e.g. &#x60;acme:developers&#x60;)  | [optional] [default to undefined]

## Example

```typescript
import { Group } from './api';

const instance: Group = {
    links,
    owner,
    workspace,
    name,
    slug,
    full_slug,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
