# Pullrequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**links** | [**PullRequestLinks**](PullRequestLinks.md) |  | [optional] [default to undefined]
**id** | **number** | The pull request\&#39;s unique ID. Note that pull request IDs are only unique within their associated repository. | [optional] [default to undefined]
**title** | **string** | Title of the pull request. | [optional] [default to undefined]
**rendered** | [**RenderedPullRequestMarkup**](RenderedPullRequestMarkup.md) |  | [optional] [default to undefined]
**summary** | [**CommentContent**](CommentContent.md) |  | [optional] [default to undefined]
**state** | **string** | The pull request\&#39;s current status. | [optional] [default to undefined]
**author** | [**Account**](Account.md) |  | [optional] [default to undefined]
**source** | [**PullrequestEndpoint**](PullrequestEndpoint.md) |  | [optional] [default to undefined]
**destination** | [**PullrequestEndpoint**](PullrequestEndpoint.md) |  | [optional] [default to undefined]
**merge_commit** | [**PullRequestCommit1**](PullRequestCommit1.md) |  | [optional] [default to undefined]
**comment_count** | **number** | The number of comments for a specific pull request. | [optional] [default to undefined]
**task_count** | **number** | The number of open tasks for a specific pull request. | [optional] [default to undefined]
**close_source_branch** | **boolean** | A boolean flag indicating if merging the pull request closes the source branch. | [optional] [default to undefined]
**closed_by** | [**Account**](Account.md) |  | [optional] [default to undefined]
**reason** | **string** | Explains why a pull request was declined. This field is only applicable to pull requests in rejected state. | [optional] [default to undefined]
**created_on** | **string** | The ISO8601 timestamp the request was created. | [optional] [default to undefined]
**updated_on** | **string** | The ISO8601 timestamp the request was last updated. | [optional] [default to undefined]
**reviewers** | [**Array&lt;Account&gt;**](Account.md) | The list of users that were added as reviewers on this pull request when it was created. For performance reasons, the API only includes this list on a pull request\&#39;s &#x60;self&#x60; URL. | [optional] [default to undefined]
**participants** | [**Array&lt;Participant&gt;**](Participant.md) |         The list of users that are collaborating on this pull request.         Collaborators are user that:          * are added to the pull request as a reviewer (part of the reviewers           list)         * are not explicit reviewers, but have commented on the pull request         * are not explicit reviewers, but have approved the pull request          Each user is wrapped in an object that indicates the user\&#39;s role and         whether they have approved the pull request. For performance reasons,         the API only returns this list when an API requests a pull request by         id.          | [optional] [default to undefined]
**draft** | **boolean** | A boolean flag indicating whether the pull request is a draft. | [optional] [default to undefined]
**queued** | **boolean** | A boolean flag indicating whether the pull request is queued | [optional] [default to undefined]

## Example

```typescript
import { Pullrequest } from './api';

const instance: Pullrequest = {
    links,
    id,
    title,
    rendered,
    summary,
    state,
    author,
    source,
    destination,
    merge_commit,
    comment_count,
    task_count,
    close_source_branch,
    closed_by,
    reason,
    created_on,
    updated_on,
    reviewers,
    participants,
    draft,
    queued,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
