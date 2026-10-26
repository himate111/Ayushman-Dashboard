using Microsoft.EntityFrameworkCore;
using BeneficiaryGrievance.Api.Models;

namespace BeneficiaryGrievance.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<ImportBatch> ImportBatches => Set<ImportBatch>();
        public DbSet<ImportError> ImportErrors => Set<ImportError>();
        public DbSet<GrievanceCategory> GrievanceCategories => Set<GrievanceCategory>();
        public DbSet<Grievance> Grievances => Set<Grievance>();
        public DbSet<GrievanceStatusHistory> GrievanceStatusHistory => Set<GrievanceStatusHistory>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            // Grievance unique constraint on CompId
            modelBuilder.Entity<Grievance>()
                .HasIndex(g => g.CompId)
                .IsUnique();

            // Analytics Indexes
            modelBuilder.Entity<Grievance>()
                .HasIndex(g => g.CompDate);

            modelBuilder.Entity<Grievance>()
                .HasIndex(g => g.Status);

            modelBuilder.Entity<Grievance>()
                .HasIndex(g => g.BeneficiaryDistrict);

            modelBuilder.Entity<Grievance>()
                .HasIndex(g => g.GrievanceCategory);

            modelBuilder.Entity<Grievance>()
                .HasIndex(g => g.OfficerName);

            modelBuilder.Entity<Grievance>()
                .HasIndex(g => g.AgeBucket);

            modelBuilder.Entity<Grievance>()
                .HasIndex(g => g.IsRiskFlagged);

            // GrievanceStatusHistory relationships
            modelBuilder.Entity<GrievanceStatusHistory>()
                .HasOne(h => h.Grievance)
                .WithMany(g => g.StatusHistory)
                .HasForeignKey(h => h.GrievanceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GrievanceStatusHistory>()
                .HasIndex(h => h.CompId);

            // ImportError relationship
            modelBuilder.Entity<ImportError>()
                .HasOne(e => e.Batch)
                .WithMany(b => b.Errors)
                .HasForeignKey(e => e.ImportBatchId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
