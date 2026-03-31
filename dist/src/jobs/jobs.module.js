"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const queue_module_1 = require("../common/queue/queue.module");
const call_timeout_job_1 = require("./call-timeout.job");
const cleanup_presence_job_1 = require("./cleanup-presence.job");
const unread_counter_job_1 = require("./unread-counter.job");
const message_processor_1 = require("./message.processor");
const scheduled_messages_job_1 = require("./scheduled-messages.job");
const messages_module_1 = require("../modules/messages/messages.module");
const media_module_1 = require("../modules/media/media.module");
const gateway_module_1 = require("../modules/gateway/gateway.module");
let JobsModule = class JobsModule {
};
exports.JobsModule = JobsModule;
exports.JobsModule = JobsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            queue_module_1.QueueModule,
            (0, common_1.forwardRef)(() => messages_module_1.MessagesModule),
            media_module_1.MediaModule,
            (0, common_1.forwardRef)(() => gateway_module_1.GatewayModule),
        ],
        providers: [call_timeout_job_1.CallTimeoutJob, cleanup_presence_job_1.CleanupPresenceJob, unread_counter_job_1.UnreadCounterJob, message_processor_1.MessageProcessor, scheduled_messages_job_1.ScheduledMessagesJob],
        exports: [call_timeout_job_1.CallTimeoutJob, cleanup_presence_job_1.CleanupPresenceJob, unread_counter_job_1.UnreadCounterJob, message_processor_1.MessageProcessor, scheduled_messages_job_1.ScheduledMessagesJob],
    })
], JobsModule);
//# sourceMappingURL=jobs.module.js.map