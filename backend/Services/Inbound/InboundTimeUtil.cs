using System;

namespace BeneficiaryGrievance.Api.Services.Inbound
{
    public static class InboundTimeUtil
    {
        public static string SecondsToLabel(double? seconds)
        {
            var safeSeconds = Math.Max(0, (long)Math.Round(seconds ?? 0));
            var hours = safeSeconds / 3600;
            var minutes = (safeSeconds % 3600) / 60;
            var secs = safeSeconds % 60;

            if (hours > 0)
                return $"{hours}h {minutes}m {secs}s";
            if (minutes > 0)
                return $"{minutes}m {secs}s";
            return $"{secs}s";
        }
    }
}
