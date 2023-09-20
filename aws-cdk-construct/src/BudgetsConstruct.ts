import { ActionThresholdType, BudgetDetails, awsManagedBudgetPolicy } from "../../common-types/BudgetDetailsTypes"
import { aws_budgets, aws_iam } from "aws-cdk-lib";
import { Construct } from "constructs"

export interface BudgetsConstructProps {
    accountAlias: string,
    emailToNotify: string,
    budgetDetails: BudgetDetails
}
export class BudgetsConstruct extends Construct {
    constructor(scope: Construct, id: string, props: BudgetsConstructProps) {
        super(scope, id);


        const budgetRole = new aws_iam.Role(this, `${props.accountAlias}_role`, {
            roleName: `${props.accountAlias}-budget-role`,
            managedPolicies: [aws_iam.ManagedPolicy.fromManagedPolicyArn(this, `${props.accountAlias}_budget_policy`, awsManagedBudgetPolicy)],
            assumedBy: new aws_iam.ServicePrincipal('budgets.amazonaws.com')
        });

        new aws_budgets.CfnBudget(this, `${props.accountAlias}_budget`, {
            budget: {
                budgetLimit: {
                    amount: props.budgetDetails.usdLimitAmount || 100,
                    unit: 'USD'
                },
                budgetName: props.budgetDetails.name,
                budgetType: props.budgetDetails.budgetType || 'COST',
                timeUnit: props.budgetDetails.timeUnit || 'ANNUALLY'
            }
        });

        if (props.budgetDetails.actionThreshold) {
            new aws_budgets.CfnBudgetsAction(this, `${props.accountAlias}_budget_action`, {
                definition: {
                    iamActionDefinition: {
                        policyArn: awsManagedBudgetPolicy,
                        roles: [budgetRole.roleArn]
                    }
                },
                budgetName: props.budgetDetails.name,
                actionThreshold: {
                    type: props.budgetDetails.actionThreshold?.type || ActionThresholdType.PERCENTAGE,
                    value: props.budgetDetails.actionThreshold?.value ||  80
                },
                subscribers: [{
                    address: props.emailToNotify,
                    type: 'EMAIL'
                }],
                actionType: 'APPLY_IAM_POLICY',
                approvalModel: 'AUTOMATIC',
                notificationType: 'ACTUAL',
                executionRoleArn: budgetRole.roleArn
            });
        }


    }
}