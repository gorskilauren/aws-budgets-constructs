import { Construct } from "constructs";
import {TerraformStack } from "cdktf";
import { BudgetsBudget } from "@cdktf/provider-aws/lib/budgets-budget";
import { BudgetsBudgetAction } from "@cdktf/provider-aws/lib/budgets-budget-action";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { DataAwsIamPolicyDocument } from "@cdktf/provider-aws/lib/data-aws-iam-policy-document";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { ActionThresholdType, BudgetDetails, BudgetType, TimeUnit, awsManagedBudgetPolicy } from "../../common-types/BudgetDetailsTypes";

export interface BudgetsModuleProps {
    accountAlias: string,
    emailToNotify: string,
    awsProvider: AwsProvider,
    budgetDetails: BudgetDetails
}

export class BudgetsModule extends TerraformStack {
    constructor(scope: Construct, id: string, props: BudgetsModuleProps) {
        super(scope, id);

        const resourceNames = this.createResourceNames(props.accountAlias);

        const assumeRolePolicy: DataAwsIamPolicyDocument = new DataAwsIamPolicyDocument(this,
            resourceNames.actionRoleAssumeRolePolicyDoc,
            {
                provider: props.awsProvider,
                statement: [{
                    effect: 'Allow',
                    principals: [{ type: "Service", identifiers: ["budgets.amazonaws.com"] }],
                    actions: ["sts:AssumeRole"]
                }]
            });

        const budgetRole = new IamRole(this, resourceNames.actionRole, {
            provider: props.awsProvider,
            name: 'budget-role',
            managedPolicyArns: [awsManagedBudgetPolicy],
            assumeRolePolicy: assumeRolePolicy.json
        });

        const budget = new BudgetsBudget(this, resourceNames.budget, {
            provider: props.awsProvider,
            name: props.budgetDetails.name,
            budgetType: props.budgetDetails.budgetType || BudgetType.COST,
            limitAmount: `${props.budgetDetails.usdLimitAmount}` || '100',
            limitUnit: 'USD',
            timeUnit: props.budgetDetails.timeUnit || TimeUnit.ANNUALLY
        });

        if (props.budgetDetails.actionThreshold) {
            new BudgetsBudgetAction(this, resourceNames.action, {
                provider: props.awsProvider,
                definition: {
                    iamActionDefinition: {
                        policyArn: awsManagedBudgetPolicy,
                        roles: [budgetRole.arn]
                    }
                },
                budgetName: budget.name,
                actionThreshold: {
                    actionThresholdType: props.budgetDetails.actionThreshold?.type || ActionThresholdType.PERCENTAGE,
                    actionThresholdValue: props.budgetDetails.actionThreshold?.value ||  80
                },
                subscriber: [{
                    address: props.emailToNotify,
                    subscriptionType: 'EMAIL'
                }],
                actionType: 'APPLY_IAM_POLICY',
                approvalModel: 'AUTOMATIC',
                notificationType: 'ACTUAL',
                executionRoleArn: budgetRole.arn
            });
        }
    }
    private createResourceNames = (accountAlias: string) => ({
        budget: `${accountAlias}_budget`,
        action: `${accountAlias}_budget_action`,
        actionRole: `${accountAlias}_budget_action_role`,
        actionRoleAssumeRolePolicyDoc: `${accountAlias}_budget_action_role_assume_role_doc`
    })
}